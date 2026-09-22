import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const failures = [];
const codes = ["promedio_general", "cursos_desaprobados", "asistencia_general", "frecuencia_acceso_lms", "tiempo_interaccion_lms", "actividades_realizadas", "recursos_consultados"];
const empty = ["user", "student", "teacher", "matricula", "teacherCourseAssignment", "course", "enrollment", "grade", "academicHistory", "attendance", "resumenAsistencia", "courseResource", "academicActivity", "activityProgress", "lmsEvent", "prediction", "prediccionFeatureSnapshot", "prediccionFactor", "alert", "alertaHistorial", "alertaFactor", "aiRecommendation", "session", "notification", "report", "mlDataset", "mlEntrenamiento", "mlModelo", "mlMetrica", "chatMessage", "messageRead"];
const date = (value) => value?.toISOString().slice(0, 10);
const expect = (name, found, wanted) => { if (found !== wanted) failures.push(`${name}: esperado=${wanted} encontrado=${found}`); };
async function main() {
  expect("Institucion BLENKIR", await prisma.institucion.count({ where: { codigo: "BLENKIR" } }), 1);
  expect("AnioLectivo 2026", await prisma.anioLectivo.count({ where: { anio: 2026 } }), 1);
  expect("Nivel Primaria", await prisma.nivelEducativo.count({ where: { codigo: "primaria" } }), 1);
  for (const [model, wanted] of Object.entries({ grado: 6, seccion: 22, areaCurricular: 8, cursoCatalogo: 16, cursoGrado: 90, role: 3, permission: 9, rolePermission: 18, mlFeatureDef: 7 })) expect(model, await prisma[model].count(), wanted);
  expect("Secciones capacidad != 30", await prisma.seccion.count({ where: { capacidad: { not: 30 } } }), 0);
  const year = await prisma.anioLectivo.findFirst({ where: { anio: 2026 } });
  if (!year) failures.push("AnioLectivo 2026 ausente");
  else {
    expect("Anio fechaInicio", date(year.fechaInicio), "2026-03-01"); expect("Anio fechaFin", date(year.fechaFin), "2026-12-15");
    const periods = await prisma.periodoAcademico.findMany({ where: { anioLectivoId: year.id }, orderBy: { numero: "asc" } });
    const wanted = [[1, "2026-03-02", "2026-05-08", false], [2, "2026-05-11", "2026-07-24", false], [3, "2026-08-03", "2026-10-09", true], [4, "2026-10-12", "2026-12-15", false]];
    expect("PeriodoAcademico 2026", periods.length, 4);
    wanted.forEach(([number, start, end, active], index) => { const found = periods[index]; if (!found || found.numero !== number || date(found.fechaInicio) !== start || date(found.fechaFin) !== end || found.activo !== active) failures.push(`Periodo ${number} no contractual`); });
    expect("DashboardSnapshot 2026", await prisma.dashboardSnapshot.count({ where: { anioLectivoId: year.id } }), 0);
  }
  const features = await prisma.mlFeatureDef.findMany({ orderBy: { orden: "asc" }, select: { codigo: true, orden: true } });
  if (features.map(({ codigo }) => codigo).join() !== codes.join() || features.some(({ orden }, index) => orden !== index + 1)) failures.push("MlFeatureDef: codigos/orden incorrectos");
  for (const model of empty) expect(model, await prisma[model].count(), 0);
  expect("Salas directas", await prisma.mensajeSala.count({ where: { alcance: "directo" } }), 0);
  const rooms = (await prisma.mensajeSala.findMany({ select: { roomId: true } })).map(({ roomId }) => roomId).sort();
  if (rooms.join() !== ["global-institucion", "profesores-interno"].sort().join()) failures.push(`MensajeSala inesperada: ${rooms.join(",")}`);
  const residue = await Promise.all([prisma.user.count({ where: { email: { contains: ".demo@" } } }), prisma.student.count({ where: { OR: [{ codigo: { startsWith: "DEMO-" } }, { email: { contains: ".demo@" } }] } }), prisma.teacher.count({ where: { OR: [{ codigo: { startsWith: "DEMO-" } }, { email: { contains: ".demo@" } }] } })]);
  if (residue.some(Boolean)) failures.push(`Residuos QA=${residue.join("/")}`);
  for (const entidad of ["estudiante", "profesor", "matricula"]) { const row = await prisma.correlativo.findUnique({ where: { entidad } }); if (!row || row.ultimoNumero !== 0) failures.push(`Correlativo ${entidad}=${row?.ultimoNumero ?? "ausente"}`); }
  if (failures.length) throw new Error(`PRESEED_ZERO_INVALID\n${failures.join("\n")}`);
  console.log("PRESEED_ZERO_OK");
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
