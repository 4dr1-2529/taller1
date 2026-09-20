/** Datos demo del sistema: 1 director, 3 profesores y 9 estudiantes. */
import bcrypt from "bcryptjs";
import { PrismaClient, type NivelRiesgo } from "@prisma/client";
import { requireDemoPassword } from "../scripts/demo-env.mjs";

const prisma = new PrismaClient();
const YEAR = 2026;

const people = [
  ["director.demo@blenkir.edu.pe", "Director Demo", "Institucional", "40000001"],
  ["profesor1.demo@blenkir.edu.pe", "Profesor Demo 1", "Primaria", "40000002"],
  ["profesor2.demo@blenkir.edu.pe", "Profesor Demo 2", "Primaria", "40000003"],
  ["profesor3.demo@blenkir.edu.pe", "Profesor Demo 3", "Primaria", "40000004"],
  ...Array.from({ length: 9 }, (_, i) => [`alumno${String(i + 1).padStart(2, "0")}.demo@blenkir.edu.pe`, `Estudiante Demo ${i + 1}`, "Datos Ficticios", `500000${String(i + 1).padStart(2, "0")}`]),
] as const;

async function getRole(codigo: "admin" | "docente" | "estudiante") {
  const role = await prisma.role.findUnique({ where: { codigo } });
  if (!role) throw new Error(`Rol ${codigo} no encontrado. Ejecute npm run db:seed primero.`);
  return role.id;
}

async function main() {
  const hash = await bcrypt.hash(requireDemoPassword(), 12);
  const [adminRole, teacherRole, studentRole] = await Promise.all([getRole("admin"), getRole("docente"), getRole("estudiante")]);
  const institution = await prisma.institucion.findUniqueOrThrow({ where: { codigo: "BLENKIR" } });
  const year = await prisma.anioLectivo.findUniqueOrThrow({ where: { institucionId_anio: { institucionId: institution.id, anio: YEAR } } });
  const period = await prisma.periodoAcademico.findFirstOrThrow({ where: { anioLectivoId: year.id, numero: 1 } });
  const level = await prisma.nivelEducativo.findUniqueOrThrow({ where: { codigo: "primaria" } });
  const sections = await prisma.seccion.findMany({ where: { grado: { nivelId: level.id, numero: 1 }, nombre: { in: ["A", "B", "C"] } }, orderBy: { nombre: "asc" } });
  if (sections.length !== 3) throw new Error("Se requieren las secciones demo 1° A, 1° B y 1° C.");
  const subject = await prisma.cursoCatalogo.findUniqueOrThrow({ where: { codigo: "ARI" } });

  const createUser = async (index: number, roleId: bigint) => {
    const [email, nombres, apellidos, dni] = people[index]!;
    return prisma.user.upsert({ where: { email }, update: { passwordHash: hash, rolId: roleId, nombres, apellidos, dni, activo: true }, create: { email, passwordHash: hash, rolId: roleId, nombres, apellidos, dni } });
  };
  await createUser(0, adminRole);
  const teachers = [];
  for (let i = 0; i < 3; i++) {
    const user = await createUser(i + 1, teacherRole);
    const [email, nombres, apellidos] = people[i + 1]!;
    teachers.push(await prisma.teacher.upsert({ where: { codigo: `DEMO-DOC-${i + 1}` }, update: { usuarioId: user.id, nombres, apellidos, email, activo: true }, create: { usuarioId: user.id, codigo: `DEMO-DOC-${i + 1}`, nombres, apellidos, especialidad: "Tutoría demo", email } }));
  }

  let assignments = 0;
  let enrollments = 0;
  for (let sectionIndex = 0; sectionIndex < 3; sectionIndex++) {
    const section = sections[sectionIndex]!;
    const teacher = teachers[sectionIndex]!;
    await prisma.tutorSeccion.upsert({ where: { seccionId_anioLectivoId: { seccionId: section.id, anioLectivoId: year.id } }, update: { profesorId: teacher.id, activo: true }, create: { seccionId: section.id, profesorId: teacher.id, anioLectivoId: year.id } });
    const assignment = await prisma.teacherCourseAssignment.upsert({ where: { profesorId_cursoId_seccionId_anioLectivoId: { profesorId: teacher.id, cursoId: subject.id, seccionId: section.id, anioLectivoId: year.id } }, update: { activo: true, esTutor: true, gradoId: section.gradoId }, create: { profesorId: teacher.id, cursoId: subject.id, gradoId: section.gradoId, seccionId: section.id, anioLectivoId: year.id, esTutor: true } });
    const course = await prisma.course.upsert({ where: { cursoId_seccionId_anioLectivoId: { cursoId: subject.id, seccionId: section.id, anioLectivoId: year.id } }, update: { profesorId: teacher.id, activo: true }, create: { codigo: `DEMO-ARI-1${section.nombre}`, cursoId: subject.id, seccionId: section.id, profesorId: teacher.id, anioLectivoId: year.id } });
    await prisma.teacherCourseAssignment.update({ where: { id: assignment.id }, data: { cursoOfertaId: course.id } });
    assignments++;

    for (let studentIndex = 0; studentIndex < 3; studentIndex++) {
      const number = sectionIndex * 3 + studentIndex + 1;
      const [email, nombres, apellidos, dni] = people[number + 3]!;
      const user = await createUser(number + 3, studentRole);
      const student = await prisma.student.upsert({ where: { codigo: `DEMO-EST-${String(number).padStart(2, "0")}` }, update: { usuarioId: user.id, nombres, apellidos, dni, email, seccionId: section.id, promedioGeneral: 12 + number / 10, asistenciaGeneral: 82 + number, activo: true, estado: "activo" }, create: { usuarioId: user.id, codigo: `DEMO-EST-${String(number).padStart(2, "0")}`, nombres, apellidos, dni, email, seccionId: section.id, promedioGeneral: 12 + number / 10, asistenciaGeneral: 82 + number, fechaIngreso: new Date("2026-03-01") } });
      await prisma.matricula.upsert({ where: { estudianteId_anioLectivoId: { estudianteId: student.id, anioLectivoId: year.id } }, update: { seccionId: section.id, estado: "activa" }, create: { estudianteId: student.id, seccionId: section.id, anioLectivoId: year.id, codigo: `DEMO-MAT-${String(number).padStart(2, "0")}`, fechaMatricula: new Date("2026-03-01") } });
      await prisma.enrollment.upsert({ where: { studentId_cursoOfertaId: { studentId: student.id, cursoOfertaId: course.id } }, update: { estado: "activa" }, create: { studentId: student.id, cursoOfertaId: course.id } });
      enrollments++;
      await prisma.grade.upsert({ where: { studentId_cursoOfertaId_periodoId: { studentId: student.id, cursoOfertaId: course.id, periodoId: period.id } }, update: { nota: 12 + number / 10 }, create: { studentId: student.id, cursoOfertaId: course.id, periodoId: period.id, nota: 12 + number / 10 } });
      await prisma.attendance.upsert({ where: { studentId_fecha: { studentId: student.id, fecha: new Date("2026-03-02") } }, update: { presente: true }, create: { studentId: student.id, fecha: new Date("2026-03-02"), presente: true } });
      await prisma.lmsIndicadorEstudiante.upsert({ where: { studentId_periodoId: { studentId: student.id, periodoId: period.id } }, update: { frecuenciaAcceso: 70, tiempoPlataforma: 4, tareasRatio: 0.8, participacion: 70, usoForos: 0.5, disminucionActividad: 5 }, create: { studentId: student.id, periodoId: period.id, frecuenciaAcceso: 70, tiempoPlataforma: 4, tareasRatio: 0.8, participacion: 70, usoForos: 0.5, disminucionActividad: 5 } });
      const levelRisk: NivelRiesgo = number % 3 === 0 ? "medio" : "bajo";
      const prediction = await prisma.prediction.create({ data: { studentId: student.id, score: levelRisk === "medio" ? 52 : 25, nivelRiesgo: levelRisk, probabilidad: levelRisk === "medio" ? 0.52 : 0.15, probabilidadAbandono: levelRisk === "medio" ? 0.52 : 0.15, periodoId: period.id } });
      if (levelRisk === "medio") await prisma.alert.create({ data: { studentId: student.id, prediccionId: prediction.id, titulo: "Alerta demo de seguimiento", descripcion: "Dato demo del sistema; no es evidencia científica.", nivelRiesgo: levelRisk, score: 52, probabilidad: 0.52, recomendacion: "Seguimiento académico demo." } });
    }
  }
  console.log("DATOS DEMO DEL SISTEMA");
  console.log("Director: 1\nProfesores: 3\nEstudiantes: 9");
  console.log(`Asignaciones: ${assignments}\nMatrículas: ${enrollments}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());