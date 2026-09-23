import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();

const BACKUP_PATH = process.env.PRESEED_BACKUP_PATH || "/tmp/blenkir-preseed-backup.json";
const EXECUTE =
  process.env.ALLOW_PRESEED_CLEANUP === "true" &&
  process.env.PRESEED_CLEANUP_EXECUTE === "true" &&
  process.env.ALLOW_PRODUCTION_PRESEED_CLEANUP === "true";
const MODE = EXECUTE ? "EXECUTE" : "DRY_RUN";

const FINAL_FEATURES = [
  { codigo: "promedio_general", nombre: "Promedio general", tipoDato: "decimal", rangoMin: 0, rangoMax: 20, orden: 1 },
  { codigo: "cursos_desaprobados", nombre: "Cursos desaprobados", tipoDato: "integer", rangoMin: 0, rangoMax: 100, orden: 2 },
  { codigo: "asistencia_general", nombre: "Asistencia general", tipoDato: "decimal", rangoMin: 0, rangoMax: 100, orden: 3 },
  { codigo: "frecuencia_acceso_lms", nombre: "Accesos por semana", tipoDato: "decimal", rangoMin: 0, rangoMax: 10000, orden: 4 },
  { codigo: "tiempo_interaccion_lms", nombre: "Horas observadas en 28 días", tipoDato: "decimal", rangoMin: 0, rangoMax: 672, orden: 5 },
  { codigo: "actividades_realizadas", nombre: "Actividades completadas", tipoDato: "integer", rangoMin: 0, rangoMax: 10000, orden: 6 },
  { codigo: "recursos_consultados", nombre: "Materiales distintos", tipoDato: "integer", rangoMin: 0, rangoMax: 10000, orden: 7 },
];

const PERIODS = [
  [1, "I Bimestre", "2026-03-02", "2026-05-08", false],
  [2, "II Bimestre", "2026-05-11", "2026-07-24", false],
  [3, "III Bimestre", "2026-08-03", "2026-10-09", true],
  [4, "IV Bimestre", "2026-10-12", "2026-12-15", false],
];

const EXPECTED_MAJOR = {
  user: 14,
  student: 10,
  teacher: 3,
  matricula: 9,
  teacherCourseAssignment: 3,
  course: 3,
  enrollment: 9,
  grade: 9,
  attendance: 9,
  lmsEvent: 25,
  prediction: 9,
  alert: 3,
  session: 46,
  mlFeatureDef: 9,
  mlDataset: 1,
  mlEntrenamiento: 1,
  mlModelo: 1,
  directRooms: 2,
  chatMessage: 2,
  messageRead: 4,
};

const STRUCTURE_EXPECTED = {
  institucion: 1,
  anioLectivo: 1,
  periodoAcademico: 4,
  nivelEducativo: 1,
  grado: 6,
  seccion: 22,
  areaCurricular: 8,
  cursoCatalogo: 16,
  cursoGrado: 90,
  role: 3,
  permission: 9,
  rolePermission: 18,
};

const zeroModelNames = [
  "user", "student", "teacher", "matricula", "teacherCourseAssignment", "tutorSeccion", "course",
  "enrollment", "horarioClase", "grade", "academicHistory", "attendance", "resumenAsistencia",
  "courseResource", "academicActivity", "activityProgress", "lmsEvent", "prediction",
  "prediccionFeatureSnapshot", "prediccionFactor", "alert", "alertaHistorial", "alertaFactor",
  "aiRecommendation", "session", "notification", "report", "dashboardSnapshot", "mlDataset",
  "mlEntrenamiento", "mlModelo", "mlMetrica", "chatMessage", "messageRead",
];

function fail(message) {
  throw new Error(message);
}

function uniq(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined))];
}

function ids(rows) {
  return rows.map((row) => row.id);
}

function replacer(_key, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

function publicUser(user) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

async function countLegacyTable(client, tableName) {
  try {
    const rows = await client.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM \`${tableName}\``);
    return Number(rows?.[0]?.c ?? 0);
  } catch {
    return null;
  }
}

async function majorCounts(client) {
  const [directRooms, ...counts] = await Promise.all([
    client.mensajeSala.count({ where: { alcance: "directo" } }),
    ...Object.keys(EXPECTED_MAJOR)
      .filter((name) => !["directRooms", "chatMessage", "messageRead"].includes(name))
      .map((name) => client[name].count()),
  ]);
  const names = Object.keys(EXPECTED_MAJOR).filter((name) => !["directRooms", "chatMessage", "messageRead"].includes(name));
  const result = { directRooms };
  names.forEach((name, index) => { result[name] = counts[index]; });
  result.chatMessage = await client.chatMessage.count();
  result.messageRead = await client.messageRead.count();
  return result;
}

async function assertStructure(client) {
  const found = {
    institucion: await client.institucion.count({ where: { codigo: "BLENKIR" } }),
    anioLectivo: await client.anioLectivo.count({ where: { anio: 2026 } }),
    periodoAcademico: await client.periodoAcademico.count({ where: { anioLectivo: { anio: 2026 } } }),
    nivelEducativo: await client.nivelEducativo.count({ where: { codigo: "primaria" } }),
    grado: await client.grado.count(),
    seccion: await client.seccion.count(),
    areaCurricular: await client.areaCurricular.count(),
    cursoCatalogo: await client.cursoCatalogo.count(),
    cursoGrado: await client.cursoGrado.count(),
    role: await client.role.count(),
    permission: await client.permission.count(),
    rolePermission: await client.rolePermission.count(),
  };
  for (const [name, expected] of Object.entries(STRUCTURE_EXPECTED)) {
    if (found[name] !== expected) fail(`STRUCTURE_MISMATCH ${name}: expected=${expected} found=${found[name]}`);
  }
  const badCapacity = await client.seccion.count({ where: { capacidad: { not: 30 } } });
  if (badCapacity !== 0) fail(`STRUCTURE_MISMATCH seccion.capacidad: bad=${badCapacity}`);
  return found;
}

async function collectQaState(client) {
  const director = await client.user.findMany({
    where: { email: "director.demo@blenkir.edu.pe" },
    include: { rol: { select: { codigo: true } } },
  });
  const teachers = await client.teacher.findMany({
    where: { codigo: { startsWith: "DEMO-DOC-" } },
    orderBy: { codigo: "asc" },
    include: { usuario: { select: { id: true, email: true, rol: { select: { codigo: true } } } } },
  });
  const students = await client.student.findMany({
    where: { codigo: { startsWith: "DEMO-EST-" } },
    orderBy: { codigo: "asc" },
    include: { usuario: { select: { id: true, email: true, rol: { select: { codigo: true } } } } },
  });

  if (director.length !== 1 || director[0].rol.codigo !== "admin") fail("FINGERPRINT_MISMATCH director QA");
  if (teachers.length !== 3 || teachers.some((row) => !row.usuarioId || row.usuario?.rol.codigo !== "docente")) fail("FINGERPRINT_MISMATCH teachers QA");
  if (students.length !== 10 || students.some((row) => !row.usuarioId || row.usuario?.rol.codigo !== "estudiante")) fail("FINGERPRINT_MISMATCH students QA");

  const expectedStudentCodes = Array.from({ length: 10 }, (_, index) => `DEMO-EST-${String(index + 1).padStart(2, "0")}`);
  if (students.map((row) => row.codigo).join("|") !== expectedStudentCodes.join("|")) fail("FINGERPRINT_MISMATCH student codes");
  const expectedTeacherCodes = ["DEMO-DOC-1", "DEMO-DOC-2", "DEMO-DOC-3"];
  if (teachers.map((row) => row.codigo).join("|") !== expectedTeacherCodes.join("|")) fail("FINGERPRINT_MISMATCH teacher codes");

  const qaUserIds = uniq([director[0].id, ...teachers.map((row) => row.usuarioId), ...students.map((row) => row.usuarioId)]);
  if (qaUserIds.length !== 14) fail(`FINGERPRINT_MISMATCH qa users unique=${qaUserIds.length}`);

  const allUsers = await client.user.findMany({
    select: { id: true, email: true, nombres: true, apellidos: true, rolId: true, activo: true, rol: { select: { codigo: true } } },
  });
  const qaSet = new Set(qaUserIds.map(String));
  const unknownUsers = allUsers.filter((row) => !qaSet.has(String(row.id)));
  if (allUsers.length !== 14 || unknownUsers.length !== 0) fail(`FINGERPRINT_MISMATCH unknown users=${unknownUsers.length} total=${allUsers.length}`);

  const studentIds = ids(students);
  const teacherIds = ids(teachers);
  const qaEmails = allUsers.map((row) => row.email);

  const assignments = await client.teacherCourseAssignment.findMany({ where: { profesorId: { in: teacherIds } } });
  const courses = await client.course.findMany({ where: { OR: [{ profesorId: { in: teacherIds } }, { id: { in: uniq(assignments.map((row) => row.cursoOfertaId)) } }] } });
  const courseIds = ids(courses);
  const tutors = await client.tutorSeccion.findMany({ where: { profesorId: { in: teacherIds } } });
  const horarios = await client.horarioClase.findMany({ where: { cursoOfertaId: { in: courseIds } } });
  const matriculas = await client.matricula.findMany({ where: { estudianteId: { in: studentIds } } });
  const enrollments = await client.enrollment.findMany({ where: { OR: [{ studentId: { in: studentIds } }, { cursoOfertaId: { in: courseIds } }] } });
  const grades = await client.grade.findMany({ where: { OR: [{ studentId: { in: studentIds } }, { cursoOfertaId: { in: courseIds } }] } });
  const academicHistory = await client.academicHistory.findMany({ where: { studentId: { in: studentIds } } });
  const attendance = await client.attendance.findMany({ where: { studentId: { in: studentIds } } });
  const resumenAsistencia = await client.resumenAsistencia.findMany({ where: { studentId: { in: studentIds } } });

  const resources = await client.courseResource.findMany({ where: { OR: [{ profesorId: { in: teacherIds } }, { courseId: { in: courseIds } }] } });
  const resourceIds = ids(resources);
  const activities = await client.academicActivity.findMany({ where: { OR: [{ profesorId: { in: teacherIds } }, { courseId: { in: courseIds } }] } });
  const activityIds = ids(activities);
  const activityProgress = await client.activityProgress.findMany({ where: { OR: [{ studentId: { in: studentIds } }, { activityId: { in: activityIds } }] } });
  const lmsEvents = await client.lmsEvent.findMany({
    where: { OR: [
      { studentId: { in: studentIds } },
      { courseId: { in: courseIds } },
      { resourceId: { in: resourceIds } },
      { activityId: { in: activityIds } },
    ] },
  });

  const predictions = await client.prediction.findMany({ where: { studentId: { in: studentIds } } });
  const predictionIds = ids(predictions);
  const predictionSnapshots = await client.prediccionFeatureSnapshot.findMany({ where: { prediccionId: { in: predictionIds } } });
  const predictionFactors = await client.prediccionFactor.findMany({ where: { prediccionId: { in: predictionIds } } });
  const recommendations = await client.aiRecommendation.findMany({ where: { OR: [{ studentId: { in: studentIds } }, { prediccionId: { in: predictionIds } }] } });
  const alerts = await client.alert.findMany({ where: { OR: [{ studentId: { in: studentIds } }, { prediccionId: { in: predictionIds } }] } });
  const alertIds = ids(alerts);
  const alertHistory = await client.alertaHistorial.findMany({ where: { alertaId: { in: alertIds } } });
  const alertFactors = await client.alertaFactor.findMany({ where: { alertaId: { in: alertIds } } });

  const sessions = await client.session.findMany({
    where: { usuarioId: { in: qaUserIds } },
    select: { id: true, usuarioId: true, ipAddress: true, userAgent: true, expiresAt: true, refreshExpires: true, revocada: true, createdAt: true },
  });
  const notifications = await client.notification.findMany({ where: { usuarioId: { in: qaUserIds } } });
  const reports = await client.report.findMany({ where: { generadoPor: { in: qaUserIds } } });
  const chatMessages = await client.chatMessage.findMany({ where: { OR: [{ remitenteId: { in: qaUserIds } }, { destinatarioId: { in: qaUserIds } }] } });
  const chatMessageIds = ids(chatMessages);
  const messageReads = await client.messageRead.findMany({ where: { OR: [{ usuarioId: { in: qaUserIds } }, { mensajeId: { in: chatMessageIds } }] } });
  const directRooms = await client.mensajeSala.findMany({ where: { alcance: "directo" }, include: { mensajes: { select: { id: true, remitenteId: true, destinatarioId: true } } } });
  for (const room of directRooms) {
    if (room.mensajes.length === 0) fail(`FINGERPRINT_MISMATCH empty direct room ${room.roomId}`);
    const unsafe = room.mensajes.some((message) => !qaSet.has(String(message.remitenteId)) || (message.destinatarioId && !qaSet.has(String(message.destinatarioId))));
    if (unsafe) fail(`FINGERPRINT_MISMATCH non-QA direct room ${room.roomId}`);
  }

  const auditLogs = await client.auditLog.findMany({ where: { OR: [
    { usuarioId: { in: qaUserIds } },
    { estudianteId: { in: studentIds } },
    { profesorId: { in: teacherIds } },
    { detalle: { contains: "DEMO-" } },
    { detalle: { contains: ".demo@" } },
  ] } });
  const loginAttempts = await client.intentoLogin.findMany({ where: { OR: [{ email: { in: qaEmails } }, { email: { contains: ".demo@" } }] } });

  const studentGuardians = await client.studentApoderado.findMany({ where: { estudianteId: { in: studentIds } } });
  const guardianIds = uniq(studentGuardians.map((row) => row.apoderadoId));
  const allGuardianLinks = guardianIds.length ? await client.studentApoderado.findMany({ where: { apoderadoId: { in: guardianIds } } }) : [];
  const unsafeGuardianLinks = allGuardianLinks.filter((row) => !studentIds.map(String).includes(String(row.estudianteId)));
  if (unsafeGuardianLinks.length) fail(`FINGERPRINT_MISMATCH guardian linked to non-QA student count=${unsafeGuardianLinks.length}`);
  const guardians = guardianIds.length ? await client.apoderado.findMany({ where: { id: { in: guardianIds } } }) : [];
  const orphanUnknownGuardians = await client.apoderado.count({ where: guardianIds.length ? { id: { notIn: guardianIds } } : undefined });
  if (orphanUnknownGuardians !== 0) fail(`FINGERPRINT_MISMATCH unknown guardians=${orphanUnknownGuardians}`);

  const year = await client.anioLectivo.findFirst({ where: { anio: 2026 } });
  if (!year) fail("FINGERPRINT_MISMATCH missing AnioLectivo 2026");
  const dashboardSnapshots = await client.dashboardSnapshot.findMany({ where: { anioLectivoId: year.id } });
  const periods = await client.periodoAcademico.findMany({ where: { anioLectivoId: year.id }, orderBy: { numero: "asc" } });
  const correlatives = await client.correlativo.findMany({ where: { entidad: { in: ["estudiante", "profesor", "matricula"] } }, orderBy: { entidad: "asc" } });

  const mlFeatures = await client.mlFeatureDef.findMany({ orderBy: { orden: "asc" } });
  const mlDatasets = await client.mlDataset.findMany();
  const mlTrainings = await client.mlEntrenamiento.findMany();
  const mlModels = await client.mlModelo.findMany();
  const mlModelIds = ids(mlModels);
  const mlMetrics = await client.mlMetrica.findMany({ where: mlModelIds.length ? { modeloId: { in: mlModelIds } } : undefined });

  return {
    year,
    director,
    teachers,
    students,
    qaUserIds,
    qaEmails,
    allUsers,
    studentIds,
    teacherIds,
    assignments,
    courses,
    courseIds,
    tutors,
    horarios,
    matriculas,
    enrollments,
    grades,
    academicHistory,
    attendance,
    resumenAsistencia,
    resources,
    resourceIds,
    activities,
    activityIds,
    activityProgress,
    lmsEvents,
    predictions,
    predictionIds,
    predictionSnapshots,
    predictionFactors,
    recommendations,
    alerts,
    alertIds,
    alertHistory,
    alertFactors,
    sessions,
    notifications,
    reports,
    chatMessages,
    chatMessageIds,
    messageReads,
    directRooms,
    auditLogs,
    loginAttempts,
    studentGuardians,
    guardians,
    dashboardSnapshots,
    periods,
    correlatives,
    mlFeatures,
    mlDatasets,
    mlTrainings,
    mlModels,
    mlMetrics,
  };
}

async function assertFingerprint(client, state) {
  const counts = await majorCounts(client);
  for (const [name, expected] of Object.entries(EXPECTED_MAJOR)) {
    if (counts[name] !== expected) fail(`FINGERPRINT_MISMATCH ${name}: expected=${expected} found=${counts[name]}`);
  }
  await assertStructure(client);

  const coverage = {
    user: state.qaUserIds.length,
    student: state.students.length,
    teacher: state.teachers.length,
    matricula: state.matriculas.length,
    teacherCourseAssignment: state.assignments.length,
    tutorSeccion: state.tutors.length,
    course: state.courses.length,
    enrollment: state.enrollments.length,
    horarioClase: state.horarios.length,
    grade: state.grades.length,
    academicHistory: state.academicHistory.length,
    attendance: state.attendance.length,
    resumenAsistencia: state.resumenAsistencia.length,
    courseResource: state.resources.length,
    academicActivity: state.activities.length,
    activityProgress: state.activityProgress.length,
    lmsEvent: state.lmsEvents.length,
    prediction: state.predictions.length,
    prediccionFeatureSnapshot: state.predictionSnapshots.length,
    prediccionFactor: state.predictionFactors.length,
    aiRecommendation: state.recommendations.length,
    alert: state.alerts.length,
    alertaHistorial: state.alertHistory.length,
    alertaFactor: state.alertFactors.length,
    session: state.sessions.length,
    notification: state.notifications.length,
    report: state.reports.length,
    chatMessage: state.chatMessages.length,
    messageRead: state.messageReads.length,
  };

  for (const [model, targeted] of Object.entries(coverage)) {
    const total = await client[model].count();
    if (total !== targeted) fail(`FINGERPRINT_MISMATCH unknown ${model}: total=${total} targeted=${targeted}`);
  }
  if (await client.mensajeSala.count({ where: { alcance: "directo" } }) !== state.directRooms.length) fail("FINGERPRINT_MISMATCH direct rooms coverage");
  if (state.directRooms.length !== 2) fail(`FINGERPRINT_MISMATCH direct rooms expected=2 found=${state.directRooms.length}`);
  if (state.mlDatasets.length !== 1 || state.mlTrainings.length !== 1 || state.mlModels.length !== 1) fail("FINGERPRINT_MISMATCH ML artifacts");

  const legacyCounts = {};
  for (const table of ["lms_actividad_semanal", "lms_entrega_tarea", "lms_indicador_estudiante"]) {
    legacyCounts[table] = await countLegacyTable(client, table);
    if (legacyCounts[table] !== null && legacyCounts[table] !== 0) fail(`FINGERPRINT_MISMATCH legacy table ${table}=${legacyCounts[table]}`);
  }
  return { counts, coverage, legacyCounts };
}

function buildBackup(state, fingerprint) {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      mode: MODE,
      purpose: "BLENKIR pre-seed zero cleanup logical backup",
      passwordHashesIncluded: false,
      tokenHashesIncluded: false,
    },
    fingerprint,
    qa: {
      users: state.allUsers.map(publicUser),
      teachers: state.teachers,
      students: state.students,
      sessions: state.sessions,
      matriculas: state.matriculas,
      assignments: state.assignments,
      tutors: state.tutors,
      courses: state.courses,
      horarios: state.horarios,
      enrollments: state.enrollments,
      grades: state.grades,
      academicHistory: state.academicHistory,
      attendance: state.attendance,
      resumenAsistencia: state.resumenAsistencia,
      resources: state.resources,
      activities: state.activities,
      activityProgress: state.activityProgress,
      lmsEvents: state.lmsEvents,
      predictions: state.predictions,
      predictionSnapshots: state.predictionSnapshots,
      predictionFactors: state.predictionFactors,
      recommendations: state.recommendations,
      alerts: state.alerts,
      alertHistory: state.alertHistory,
      alertFactors: state.alertFactors,
      notifications: state.notifications,
      reports: state.reports,
      chatMessages: state.chatMessages,
      messageReads: state.messageReads,
      directRooms: state.directRooms.map(({ mensajes: _messages, ...room }) => room),
      auditLogs: state.auditLogs,
      loginAttempts: state.loginAttempts,
      studentGuardians: state.studentGuardians,
      guardians: state.guardians,
      dashboardSnapshots: state.dashboardSnapshots,
    },
    structureBefore: {
      year: state.year,
      periods: state.periods,
      correlatives: state.correlatives,
      mlFeatures: state.mlFeatures,
      mlDatasets: state.mlDatasets,
      mlTrainings: state.mlTrainings,
      mlModels: state.mlModels,
      mlMetrics: state.mlMetrics,
    },
  };
}

function writeBackup(backup) {
  const json = JSON.stringify(backup, replacer, 2);
  writeFileSync(BACKUP_PATH, json, { encoding: "utf8", mode: 0o600 });
  const bytes = Buffer.byteLength(json, "utf8");
  const sha256 = createHash("sha256").update(json, "utf8").digest("hex");
  console.log("BACKUP_OK");
  console.log(`BACKUP_PATH=${BACKUP_PATH}`);
  console.log(`BACKUP_BYTES=${bytes}`);
  console.log(`BACKUP_SHA256=${sha256}`);
  return { bytes, sha256 };
}

function planFrom(state) {
  return {
    delete: {
      messageRead: state.messageReads.length,
      chatMessage: state.chatMessages.length,
      directRooms: state.directRooms.length,
      notifications: state.notifications.length,
      sessions: state.sessions.length,
      auditLogsQa: state.auditLogs.length,
      loginAttemptsQa: state.loginAttempts.length,
      reports: state.reports.length,
      alertFactors: state.alertFactors.length,
      alertHistory: state.alertHistory.length,
      alerts: state.alerts.length,
      recommendations: state.recommendations.length,
      predictionFactors: state.predictionFactors.length,
      predictionSnapshots: state.predictionSnapshots.length,
      predictions: state.predictions.length,
      lmsEvents: state.lmsEvents.length,
      activityProgress: state.activityProgress.length,
      resources: state.resources.length,
      activities: state.activities.length,
      grades: state.grades.length,
      academicHistory: state.academicHistory.length,
      resumenAsistencia: state.resumenAsistencia.length,
      attendance: state.attendance.length,
      enrollments: state.enrollments.length,
      matriculas: state.matriculas.length,
      horarios: state.horarios.length,
      assignments: state.assignments.length,
      tutors: state.tutors.length,
      courses: state.courses.length,
      studentGuardians: state.studentGuardians.length,
      guardians: state.guardians.length,
      students: state.students.length,
      teachers: state.teachers.length,
      users: state.qaUserIds.length,
      dashboardSnapshots2026: state.dashboardSnapshots.length,
      mlMetrics: state.mlMetrics.length,
      mlModels: state.mlModels.length,
      mlTrainings: state.mlTrainings.length,
      mlDatasets: state.mlDatasets.length,
      staleMlFeatures: state.mlFeatures.filter((feature) => !FINAL_FEATURES.some((wanted) => wanted.codigo === feature.codigo)).length,
    },
    update: {
      year2026: 1,
      periods2026: 4,
      finalMlFeatures: 7,
      correlatives: 3,
      structuralRooms: 2,
    },
  };
}

async function applyCleanup(tx, state) {
  const delIds = async (model, rows) => {
    const rowIds = ids(rows);
    if (!rowIds.length) return;
    await tx[model].deleteMany({ where: { id: { in: rowIds } } });
  };

  if (state.messageReads.length) {
    await tx.messageRead.deleteMany({ where: { OR: [{ usuarioId: { in: state.qaUserIds } }, { mensajeId: { in: state.chatMessageIds } }] } });
  }
  await delIds("chatMessage", state.chatMessages);
  await delIds("mensajeSala", state.directRooms);
  await delIds("notification", state.notifications);
  await delIds("session", state.sessions);
  await delIds("auditLog", state.auditLogs);
  await delIds("intentoLogin", state.loginAttempts);
  await delIds("report", state.reports);
  await delIds("alertaFactor", state.alertFactors);
  await delIds("alertaHistorial", state.alertHistory);
  await delIds("alert", state.alerts);
  await delIds("aiRecommendation", state.recommendations);
  await delIds("prediccionFactor", state.predictionFactors);
  await delIds("prediccionFeatureSnapshot", state.predictionSnapshots);
  await delIds("prediction", state.predictions);
  await delIds("lmsEvent", state.lmsEvents);

  if (state.activityProgress.length) {
    await tx.activityProgress.deleteMany({ where: { OR: [{ studentId: { in: state.studentIds } }, { activityId: { in: state.activityIds } }] } });
  }
  await delIds("courseResource", state.resources);
  await delIds("academicActivity", state.activities);
  await delIds("grade", state.grades);
  await delIds("academicHistory", state.academicHistory);
  await delIds("resumenAsistencia", state.resumenAsistencia);
  await delIds("attendance", state.attendance);
  await delIds("enrollment", state.enrollments);
  await delIds("matricula", state.matriculas);
  await delIds("horarioClase", state.horarios);
  await delIds("teacherCourseAssignment", state.assignments);
  await delIds("tutorSeccion", state.tutors);
  await delIds("course", state.courses);

  if (state.studentGuardians.length) {
    await tx.studentApoderado.deleteMany({ where: { estudianteId: { in: state.studentIds } } });
  }
  await delIds("apoderado", state.guardians);
  await delIds("student", state.students);
  await delIds("teacher", state.teachers);
  await tx.user.deleteMany({ where: { id: { in: state.qaUserIds } } });
  await delIds("dashboardSnapshot", state.dashboardSnapshots);

  await delIds("mlMetrica", state.mlMetrics);
  await delIds("mlModelo", state.mlModels);
  await delIds("mlEntrenamiento", state.mlTrainings);
  await delIds("mlDataset", state.mlDatasets);

  await tx.mlFeatureDef.deleteMany({ where: { codigo: { notIn: FINAL_FEATURES.map((row) => row.codigo) } } });
  for (const feature of FINAL_FEATURES) {
    await tx.mlFeatureDef.upsert({ where: { codigo: feature.codigo }, update: feature, create: feature });
  }

  await tx.anioLectivo.update({ where: { id: state.year.id }, data: { fechaInicio: new Date("2026-03-01"), fechaFin: new Date("2026-12-15"), activo: true } });
  for (const [numero, nombre, fechaInicio, fechaFin, activo] of PERIODS) {
    await tx.periodoAcademico.upsert({
      where: { anioLectivoId_numero: { anioLectivoId: state.year.id, numero } },
      update: { nombre, fechaInicio: new Date(fechaInicio), fechaFin: new Date(fechaFin), activo },
      create: { anioLectivoId: state.year.id, numero, nombre, fechaInicio: new Date(fechaInicio), fechaFin: new Date(fechaFin), activo },
    });
  }

  for (const [entidad, prefijo] of [["estudiante", "EST-"], ["profesor", "PROF-"], ["matricula", "MAT-2026-"]]) {
    await tx.correlativo.upsert({ where: { entidad }, update: { prefijo, ultimoNumero: 0 }, create: { entidad, prefijo, ultimoNumero: 0 } });
  }
  await tx.mensajeSala.upsert({ where: { roomId: "global-institucion" }, update: { alcance: "global" }, create: { roomId: "global-institucion", alcance: "global", titulo: "Comunicados I.E.P. Blenkir" } });
  await tx.mensajeSala.upsert({ where: { roomId: "profesores-interno" }, update: { alcance: "profesores" }, create: { roomId: "profesores-interno", alcance: "profesores", titulo: "Coordinación docente" } });
}

async function assertZero(client) {
  for (const model of zeroModelNames) {
    const count = model === "dashboardSnapshot"
      ? await client.dashboardSnapshot.count({ where: { anioLectivo: { anio: 2026 } } })
      : await client[model].count();
    if (count !== 0) fail(`POSTCHECK_FAILED ${model}=${count}`);
  }
  if (await client.mensajeSala.count({ where: { alcance: "directo" } }) !== 0) fail("POSTCHECK_FAILED direct rooms");
  const rooms = (await client.mensajeSala.findMany({ select: { roomId: true } })).map((row) => row.roomId).sort();
  if (rooms.join("|") !== ["global-institucion", "profesores-interno"].sort().join("|")) fail(`POSTCHECK_FAILED rooms=${rooms.join(",")}`);
  if (await client.apoderado.count() !== 0 || await client.studentApoderado.count() !== 0) fail("POSTCHECK_FAILED guardians");

  const structure = await assertStructure(client);
  const year = await client.anioLectivo.findFirst({ where: { anio: 2026 } });
  const date = (value) => value?.toISOString().slice(0, 10);
  if (date(year.fechaInicio) !== "2026-03-01" || date(year.fechaFin) !== "2026-12-15") fail("POSTCHECK_FAILED year dates");
  const periods = await client.periodoAcademico.findMany({ where: { anioLectivoId: year.id }, orderBy: { numero: "asc" } });
  if (periods.length !== 4) fail(`POSTCHECK_FAILED periods=${periods.length}`);
  PERIODS.forEach(([numero, _nombre, start, end, active], index) => {
    const row = periods[index];
    if (!row || row.numero !== numero || date(row.fechaInicio) !== start || date(row.fechaFin) !== end || row.activo !== active) fail(`POSTCHECK_FAILED period ${numero}`);
  });
  const features = await client.mlFeatureDef.findMany({ orderBy: { orden: "asc" } });
  if (features.length !== 7 || features.some((row, index) => row.codigo !== FINAL_FEATURES[index].codigo || row.orden !== index + 1)) fail("POSTCHECK_FAILED ML features");
  for (const entity of ["estudiante", "profesor", "matricula"]) {
    const row = await client.correlativo.findUnique({ where: { entidad: entity } });
    if (!row || row.ultimoNumero !== 0) fail(`POSTCHECK_FAILED correlativo ${entity}`);
  }
  const residue = await Promise.all([
    client.user.count({ where: { email: { contains: ".demo@" } } }),
    client.student.count({ where: { codigo: { startsWith: "DEMO-" } } }),
    client.teacher.count({ where: { codigo: { startsWith: "DEMO-" } } }),
  ]);
  if (residue.some(Boolean)) fail(`POSTCHECK_FAILED QA residue=${residue.join("/")}`);
  return structure;
}

async function main() {
  console.log(`MODE=${MODE}`);
  console.log(`NODE_ENV=${process.env.NODE_ENV ?? "unset"}`);
  console.log(`DATASET_INPUT_STATUS=NOT_PROVIDED`);

  if (EXECUTE && process.env.NODE_ENV !== "production") fail("EXECUTION_REFUSED NODE_ENV must be production");
  if (!process.env.DATABASE_URL) fail("DATABASE_URL missing");

  const state = await collectQaState(prisma);
  const fingerprint = await assertFingerprint(prisma, state);
  console.log("FINGERPRINT_OK");
  console.log(`FINGERPRINT_COUNTS=${JSON.stringify(fingerprint.counts)}`);

  const backup = buildBackup(state, fingerprint);
  const backupMeta = writeBackup(backup);
  const plan = planFrom(state);
  console.log(`DELETE_PLAN=${JSON.stringify(plan.delete)}`);
  console.log(`UPDATE_PLAN=${JSON.stringify(plan.update)}`);

  if (!EXECUTE) {
    const afterDryRun = await majorCounts(prisma);
    if (JSON.stringify(afterDryRun) !== JSON.stringify(fingerprint.counts)) fail("DRY_RUN_MUTATION_DETECTED");
    console.log("DRY_RUN_OK");
    console.log(`BACKUP_VERIFIED_SHA256=${backupMeta.sha256}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const txState = await collectQaState(tx);
    await assertFingerprint(tx, txState);
    await applyCleanup(tx, txState);
  }, { maxWait: 10000, timeout: 120000 });

  const structure = await assertZero(prisma);
  console.log(`STRUCTURE_OK=${JSON.stringify(structure)}`);
  console.log("PRESEED_ZERO_OK");
}

main()
  .catch((error) => {
    console.error(error?.stack || error?.message || String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
