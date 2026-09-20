/** Explicit, scoped demo cleanup. Never invoked by migrations or deployment. */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

if (process.env.ALLOW_DEMO_RESET !== "true") throw new Error("Set ALLOW_DEMO_RESET=true explicitly");
if (process.env.NODE_ENV === "production") throw new Error("Production reset is disabled. Use an isolated staging copy.");
if (!process.env.DATABASE_URL || !process.env.DEMO_RESET_MANIFEST) throw new Error("DATABASE_URL and DEMO_RESET_MANIFEST are required");
const manifest = z.object({ userIds: z.array(z.string().regex(/^[1-9]\d*$/)).min(1), synthetic: z.literal(true) }).strict().parse(JSON.parse(readFileSync(process.env.DEMO_RESET_MANIFEST, "utf8")));
const ids = manifest.userIds.map(BigInt);
const db = new PrismaClient();
try {
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, estudiante: { select: { id: true } }, profesor: { select: { id: true } } } });
  if (users.length !== new Set(manifest.userIds).size) throw new Error("Manifest contains unknown users");
  const students = users.flatMap(u => u.estudiante ? [u.estudiante.id] : []);
  const teachers = users.flatMap(u => u.profesor ? [u.profesor.id] : []);
  const outside = await db.enrollment.count({ where: { course: { profesorId: { in: teachers } }, studentId: { notIn: students }, estado: "activa" } });
  if (outside) throw new Error("A selected teacher has students outside the demo manifest");
  console.log(JSON.stringify({ dryRun: process.env.DEMO_RESET_EXECUTE !== "true", users: users.length, students: students.length, teachers: teachers.length }));
  if (process.env.DEMO_RESET_EXECUTE === "true") await db.$transaction(async tx => {
    await tx.lmsEvent.deleteMany({ where: { studentId: { in: students } } });
    await tx.activityProgress.deleteMany({ where: { studentId: { in: students } } });
    await tx.grade.deleteMany({ where: { studentId: { in: students } } });
    await tx.attendance.deleteMany({ where: { studentId: { in: students } } });
    await tx.alert.deleteMany({ where: { studentId: { in: students } } });
    await tx.aiRecommendation.deleteMany({ where: { studentId: { in: students } } });
    await tx.prediction.deleteMany({ where: { studentId: { in: students } } });
    await tx.enrollment.updateMany({ where: { studentId: { in: students } }, data: { estado: "retirada" } });
    await tx.matricula.updateMany({ where: { estudianteId: { in: students } }, data: { estado: "retirada" } });
    await tx.student.updateMany({ where: { id: { in: students } }, data: { activo: false, promedioGeneral: 0, asistenciaGeneral: 0 } });
    await tx.teacher.updateMany({ where: { id: { in: teachers } }, data: { activo: false } });
    await tx.teacherCourseAssignment.updateMany({ where: { profesorId: { in: teachers } }, data: { activo: false } });
    await tx.courseResource.updateMany({ where: { profesorId: { in: teachers } }, data: { activo: false } });
    await tx.academicActivity.updateMany({ where: { profesorId: { in: teachers } }, data: { activo: false } });
    await tx.user.updateMany({ where: { id: { in: ids } }, data: { activo: false } });
    await tx.session.updateMany({ where: { usuarioId: { in: ids } }, data: { revocada: true } });
    await tx.auditLog.create({ data: { entidad: "Demo", accion: "RESET_EXPLICIT", detalle: JSON.stringify({ users: manifest.userIds, synthetic: true }) } });
  }, { timeout: 30000 });
} finally { await db.$disconnect(); }
