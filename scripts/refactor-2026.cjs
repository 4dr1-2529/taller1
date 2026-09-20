const fs = require('node:fs');
function edit(path, fn) { fs.writeFileSync(path, fn(fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n'))); }
edit('backend/prisma/schema.prisma', s => s + `
model Correlativo {
  entidad String @id @db.VarChar(30)
  prefijo String @db.VarChar(20)
  ultimoNumero Int @default(0) @map("ultimo_numero")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("correlativo")
}
`);
edit('backend/src/validators/schemas.ts', s => {
  const start = s.indexOf('export const studentSchema');
  const end = s.indexOf('export const enrollmentSchema');
  s = s.slice(0,start) + `export const studentSchema = z.object({
  nombres: personNameField,
  apellidos: personNameField,
  seccionId: z.string().regex(/^[1-9]\\d*$/, "Seleccione grado y sección"),
  dni: z.string().regex(/^\\d{8}$/, "DNI debe tener 8 dígitos"),
  correo: optionalEmailField,
  telefono: optionalPhoneField,
}).strict();

export const updateStudentSchema = studentSchema.omit({ seccionId: true }).partial().extend({
  estado: z.enum(["activo", "retirado"]).optional(),
}).strict().refine(d => Object.keys(d).length > 0, { message: "Indique campos para actualizar" });

` + s.slice(end);
  s = s.replace('  codigo: z.string().max(30).optional(),\n','');
  return s;
});
edit('backend/src/controllers/students.controller.ts', s => {
  s = s.replace('import bcrypt from "bcryptjs";', 'import { registerStudent } from "../services/student-registration.service.js";');
  s = s.replace('studentSchema, updateStudentSchema', 'updateStudentSchema');
  s = s.replace(/^import .*person-accounts.*\n/m,'').replace(/^import .*institution-password.*\n/m,'');
  const start = s.indexOf('    const data = studentSchema.parse');
  const end = s.indexOf('\n  } catch (e)',start);
  s = s.slice(0,start) + '    sendCreated(res, await registerStudent(req.body, req.user!.sub, req.ip));' + s.slice(end);
  s = s.replace(/^        seccionId: data.seccionId.*\n/m,'').replace(/^        promedioGeneral: data.promedioGeneral,\n/m,'').replace(/^        asistenciaGeneral: data.asistenciaGeneral,\n/m,'');
  s = s.replace('accion: "DELETE"', 'accion: "DEACTIVATE"');
  return s;
});
edit('backend/src/controllers/matriculas.controller.ts', s => {
  s = 'import { enroll2026 } from "../services/student-registration.service.js";\n' + s;
  const start = s.indexOf('    const [student, seccion, anio]');
  const end = s.indexOf('    sendCreated(res, { item: mapMatricula(item) });',start);
  return s.slice(0,start) + `    const year = await prisma.anioLectivo.findUnique({ where: { id: toDbId(data.anioLectivoId) } });
    if (year?.anio !== 2026 || data.estado && data.estado !== "activa") throw new AppError(400, "Solo matrícula activa 2026");
    const item = await prisma.$transaction(tx => enroll2026(tx, toDbId(data.estudianteId), toDbId(data.seccionId), req.user!.sub, req.ip));
` + s.slice(end);
});
edit('backend/src/routes/index.ts', s => s.replace(/(router\.(?:post|put|delete)\("\/(?:grades|attendance)[^\n]*authorize\()"admin", "docente"/g,'$1"docente"').replace(/(router.delete\("\/attendance\/:id", authenticate, authorize\()"admin"/g,'$1"docente"'));
edit('backend/src/utils/academic-period.ts', s => s.replace('where: { activo: true }','where: { activo: true, anio: 2026 }').replace('  if (periodoId) return toDbId(periodoId);', `  if (periodoId) {
    const period = await prisma.periodoAcademico.findFirst({ where: { id: toDbId(periodoId), anioLectivo: { anio: 2026 } } });
    if (!period) throw new AppError(400, "Periodo ajeno al año 2026");
    return period.id;
  }`).replace('where: { activo: true },\n    orderBy: { numero', 'where: { activo: true, anioLectivo: { anio: 2026 } },\n    orderBy: { numero'));
edit('backend/scripts/railway-start.mjs', s => {
  const start = s.indexOf('if (process.env.RUN_DEMO_SEED');
  const end = s.indexOf('console.log("[railway-start] iniciando API")',start);
  return s.slice(0,start) + '// No population or repair scripts run during deployment.\n' + s.slice(end);
});
