const fs = require('node:fs');
function edit(path, fn) { fs.writeFileSync(path, fn(fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n'))); }
edit('backend/prisma/schema.prisma', s => s.replace('model Teacher {\n', 'model Teacher {\n  dni String? @unique @db.VarChar(8)\n'));
edit('backend/src/validators/schemas.ts', s => {
  const a = s.indexOf('export const teacherSchema');
  const b = s.indexOf('export const updateTeacherSchema');
  return s.slice(0,a) + `export const teacherSchema = z.object({
  dni: z.string().regex(/^\\d{8}$/, "DNI debe tener 8 dígitos"),
  nombres: personNameField, apellidos: personNameField, especialidad: personNameField,
  correo: z.string().email().max(120).transform(v => v.trim().toLowerCase()),
  telefono: optionalPhoneField, password: securePasswordField.optional(),
  crearCuenta: z.boolean().optional(),
}).strict().refine(d => !d.crearCuenta || !!d.password, { message: "Contraseña requerida", path: ["password"] });

` + s.slice(b);
});
edit('backend/src/controllers/teachers.controller.ts', s => {
  s = 'import { registerTeacher } from "../services/teacher-registration.service.js";\n' + s;
  const a = s.indexOf('    const data = teacherSchema.parse');
  const b = s.indexOf('    sendCreated(res, { teacher:',a);
  return (s.slice(0,a) + '    const teacher = await registerTeacher(req.body, req.user!.sub, req.ip);\n' + s.slice(b)).replace('accion: "DELETE"','accion: "DEACTIVATE"');
});
edit('backend/src/controllers/messages.controller.ts', s => {
  s = 'import { assertDirectConversation } from "../services/message-policy.service.js";\n' + s;
  s = s.replace('    return;\n  }\n  if (roomId ===', '    await assertDirectConversation(user.sub, parts[1] === user.sub ? parts[2] : parts[1]);\n    return;\n  }\n  if (roomId ===');
  s = s.replace('    if (!roomId) throw', `    if (scope === "directo") {
      const parts = roomId.split(":");
      if (parts.length !== 3 || parts[0] !== "direct" || !parts.slice(1).includes(user.sub)) throw new AppError(403, "Conversación inválida");
      const other = parts[1] === user.sub ? parts[2] : parts[1];
      await assertDirectConversation(user.sub, other);
      recipientUserId = other;
    } else {
      if (data.parentMessageId) throw new AppError(403, "Los avisos no admiten respuestas");
      if (scope === "curso" && user.role !== "docente") throw new AppError(403, "Solo profesores publican avisos académicos");
      await assertRoomAccess(user, roomId);
      recipientUserId = null;
    }
    if (data.parentMessageId) {
      const parent = await prisma.chatMessage.findUnique({ where: { id: toDbId(data.parentMessageId) }, include: { sala: true } });
      if (!parent || parent.sala.roomId !== roomId || parent.sala.alcance !== "directo") throw new AppError(403, "Respuesta fuera de conversación");
    }
    if (!roomId) throw`);
  s = s.replace('    sendSuccess(res, { rooms });', `    if (user.role === "admin" || user.role === "docente") {
      const peers = await prisma.user.findMany({ where: { activo: true, rol: { codigo: user.role === "admin" ? "docente" : "admin" } } });
      for (const peer of peers) rooms.push({ roomId: directRoom(user.sub, String(peer.id)), label: [peer.nombres, peer.apellidos].join(" "), scope: "directo" });
    }
    sendSuccess(res, { rooms });`);
  s = s.replace('      const course = await prisma.course.findFirst({\n        where: { id: toDbId(courseId), profesorId: teacher?.id },','      if (!teacher) throw new AppError(403, "Profesor no vinculado");\n      const course = await prisma.course.findFirst({\n        where: { id: toDbId(courseId), profesorId: teacher.id, activo: true },');
  s = s.replace('      const en = await prisma.enrollment.findFirst({\n        where: { studentId: student?.id, cursoOfertaId: toDbId(courseId) },','      if (!student) throw new AppError(403, "Estudiante no vinculado");\n      const en = await prisma.enrollment.findFirst({\n        where: { studentId: student.id, cursoOfertaId: toDbId(courseId), estado: "activa" },');
  return s;
});
edit('backend/src/middleware/auth.ts', s => s.replace('import jwt from "jsonwebtoken";', 'import jwt from "jsonwebtoken";\nimport { prisma } from "../utils/prisma.js";').replace('export function authenticate(', 'export async function authenticate(').replace('      req.user = decoded;', `      const active = await prisma.user.findFirst({ where: { id: BigInt(decoded.sub), activo: true, rol: { codigo: decoded.role } } });
      if (!active) return next(new AppError(401, "Cuenta inactiva"));
      req.user = decoded;`));
edit('backend/src/controllers/auth.controller.ts', s => s.replace('tokenHash: hashToken(refreshToken),\n          expiresAt:', 'tokenHash: hashToken(refreshToken),\n          revocada: false,\n          expiresAt:'));
edit('backend/src/controllers/students.controller.ts', s => s.replace(`    await prisma.student.update({
      where: { id },
      data: { activo: false },
    });`, `    await prisma.$transaction(async tx => {
      const student = await tx.student.update({ where: { id }, data: { activo: false } });
      if (student.usuarioId) {
        await tx.user.update({ where: { id: student.usuarioId }, data: { activo: false } });
        await tx.session.updateMany({ where: { usuarioId: student.usuarioId }, data: { revocada: true } });
      }
    });`));
edit('backend/src/controllers/grades.controller.ts', s => s.replace('    const item = await prisma.grade.delete({ where: { id: paramBigIntId(req) } });', `    const existing = await prisma.grade.findUniqueOrThrow({ where: { id: paramBigIntId(req) } });
    await assertStudentInScope(req.user!, String(existing.studentId));
    await assertTeacherCourseAccess(req.user!, String(existing.cursoOfertaId));
    const item = await prisma.grade.delete({ where: { id: existing.id } });`));
edit('backend/src/controllers/attendance.controller.ts', s => s.replace('    const { presente, justificado } = req.body;', `    const existing = await prisma.attendance.findUniqueOrThrow({ where: { id: paramBigIntId(req) } });
    await assertStudentInScope(req.user!, String(existing.studentId));
    const { presente, justificado, tardanza, observacion } = attendanceSchema.omit({ studentId: true, fecha: true }).parse(req.body);`).replace('data: { presente, justificado },', 'data: { presente, justificado, tardanza, observacion },').replace('    await prisma.attendance.delete({ where: { id } });', '    const existing = await prisma.attendance.findUniqueOrThrow({ where: { id } });\n    await assertStudentInScope(req.user!, String(existing.studentId));\n    await prisma.attendance.delete({ where: { id } });'));
edit('backend/src/middleware/errorHandler.ts', s => s.replace('  if (env.NODE_ENV', `  if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
    return res.status(409).json(errorPayload("DNI, correo, código o registro duplicado"));
  }
  if (env.NODE_ENV`));
