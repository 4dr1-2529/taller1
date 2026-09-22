import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const structural = { institucion: 1, anioLectivo: 1, periodoAcademico: 4, nivelEducativo: 1, grado: 6, seccion: 22, areaCurricular: 8, cursoCatalogo: 16, cursoGrado: 90, role: 3, permission: 9, rolePermission: 18, mlFeatureDef: 7 };
const empty = ["user", "student", "teacher", "matricula", "teacherCourseAssignment", "course", "enrollment", "grade", "academicHistory", "attendance", "resumenAsistencia", "courseResource", "academicActivity", "activityProgress", "lmsEvent", "prediction", "alert", "aiRecommendation", "dashboardSnapshot", "mlDataset", "mlEntrenamiento", "mlModelo", "mlMetrica"];
const features = ["promedio_general", "cursos_desaprobados", "asistencia_general", "frecuencia_acceso_lms", "tiempo_interaccion_lms", "actividades_realizadas", "recursos_consultados"];
async function main() {
  const failures = [];
  for (const [model, expected] of Object.entries(structural)) {
    const where = model === "anioLectivo" ? { anio: 2026 } : model === "periodoAcademico" ? { anioLectivo: { anio: 2026 } } : undefined;
    const found = await prisma[model].count({ where }); if (found !== expected) failures.push(`${model}: ${found} != ${expected}`);
  }
  for (const model of empty) { const found = await prisma[model].count(); if (found) failures.push(`${model}: ${found} != 0`); }
  if (await prisma.seccion.count({ where: { capacidad: { not: 30 } } })) failures.push("capacidad de seccion != 30");
  const codes = (await prisma.mlFeatureDef.findMany({ orderBy: { orden: "asc" }, select: { codigo: true } })).map(({ codigo }) => codigo);
  if (codes.join() !== features.join()) failures.push("features ML incorrectas");
  const demo = await Promise.all([prisma.user.count({ where: { email: { contains: ".demo@" } } }), prisma.student.count({ where: { codigo: { startsWith: "DEMO-" } } }), prisma.teacher.count({ where: { codigo: { startsWith: "DEMO-" } } })]);
  if (demo.some(Boolean)) failures.push(`residuos DEMO: ${demo.join(",")}`);
  if (failures.length) throw new Error(`PRESEED_ZERO_INVALID\n${failures.join("\n")}`);
  console.log("PRESEED_ZERO_OK");
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
