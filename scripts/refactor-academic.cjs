const fs = require('node:fs');
function edit(p,fn) { fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'))); }
edit('backend/src/controllers/grades.controller.ts',s=> {
  s='import { refreshAcademicSummary, academicAudit } from "../services/academic-records.service.js";\n'+s;
  s=s.replace('    const item = await prisma.grade.upsert({','    const item = await prisma.$transaction(async tx => {\n      await tx.$queryRaw`SELECT id FROM estudiante WHERE id = ${studentId} FOR UPDATE`;\n      const record = await tx.grade.upsert({');
  const a=s.indexOf('    const agg ='); const b=s.indexOf('    sendCreated',a);
  s=s.slice(0,a)+`      await refreshAcademicSummary(tx, studentId);
      await academicAudit(tx, req.user!.sub, "Grade", record.id, studentId, "UPSERT", req.ip);
      return record;
    });
`+s.slice(b);
  s=s.replace('    const item = await prisma.grade.delete({ where: { id: existing.id } });', `    const item = await prisma.$transaction(async tx => {
      await tx.$queryRaw\`SELECT id FROM estudiante WHERE id = \${existing.studentId} FOR UPDATE\`;
      const item = await tx.grade.delete({ where: { id: existing.id } });
      await refreshAcademicSummary(tx, existing.studentId);
      await academicAudit(tx, req.user!.sub, "Grade", item.id, item.studentId, "DELETE", req.ip);
      return item;
    });`);
  return s;
});
edit('backend/src/controllers/attendance.controller.ts',s=> {
  const a=s.indexOf('export async function createAttendance');
  return 'import { refreshAcademicSummary, academicAudit } from "../services/academic-records.service.js";\n'+s.slice(0,a)+`
export async function createAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = attendanceSchema.parse(req.body);
    await assertStudentInScope(req.user!, data.studentId);
    const studentId = toDbId(data.studentId);
    const record = await prisma.$transaction(async tx => {
      await tx.$queryRaw\`SELECT id FROM estudiante WHERE id = \${studentId} FOR UPDATE\`;
      const record = await tx.attendance.create({ data: { ...data, studentId, fecha: new Date(data.fecha) } });
      await refreshAcademicSummary(tx, studentId);
      await academicAudit(tx, req.user!.sub, "Attendance", record.id, studentId, "CREATE", req.ip);
      return record;
    });
    sendCreated(res, { record });
  } catch (e) { next(e); }
}
export async function bulkAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bulkAttendanceSchema.parse(req.body);
    for (const record of data.records) await assertStudentInScope(req.user!, record.studentId);
    const fecha = new Date(data.fecha);
    await prisma.$transaction(async tx => {
      for (const r of [...data.records].sort((a,b) => Number(a.studentId) - Number(b.studentId))) {
        const studentId = toDbId(r.studentId);
        await tx.$queryRaw\`SELECT id FROM estudiante WHERE id = \${studentId} FOR UPDATE\`;
        const record = await tx.attendance.upsert({ where: { studentId_fecha: { studentId, fecha } }, create: { ...r, studentId, fecha }, update: { presente: r.presente, justificado: r.justificado, tardanza: r.tardanza, observacion: r.observacion } });
        await refreshAcademicSummary(tx, studentId);
        await academicAudit(tx, req.user!.sub, "Attendance", record.id, studentId, "UPSERT", req.ip);
      }
    }, { timeout: 20000 });
    sendCreated(res, { upserted: data.records.length, fecha: data.fecha });
  } catch (e) { next(e); }
}
export async function updateAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    const existing = await prisma.attendance.findUniqueOrThrow({ where: { id } });
    await assertStudentInScope(req.user!, String(existing.studentId));
    const data = attendanceSchema.omit({ studentId: true, fecha: true }).parse(req.body);
    const record = await prisma.$transaction(async tx => {
      await tx.$queryRaw\`SELECT id FROM estudiante WHERE id = \${existing.studentId} FOR UPDATE\`;
      const record = await tx.attendance.update({ where: { id }, data });
      await refreshAcademicSummary(tx, existing.studentId);
      await academicAudit(tx, req.user!.sub, "Attendance", id, existing.studentId, "UPDATE", req.ip);
      return record;
    });
    sendSuccess(res, { record });
  } catch (e) { next(e); }
}
export async function deleteAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    const existing = await prisma.attendance.findUniqueOrThrow({ where: { id } });
    await assertStudentInScope(req.user!, String(existing.studentId));
    await prisma.$transaction(async tx => {
      await tx.$queryRaw\`SELECT id FROM estudiante WHERE id = \${existing.studentId} FOR UPDATE\`;
      await tx.attendance.delete({ where: { id } });
      await refreshAcademicSummary(tx, existing.studentId);
      await academicAudit(tx, req.user!.sub, "Attendance", id, existing.studentId, "DELETE", req.ip);
    });
    sendSuccess(res, {}, "Registro eliminado");
  } catch (e) { next(e); }
}
`;
});
edit('backend/src/validators/schemas.ts',s=>s.replaceAll('fecha: z.string().min(1),','fecha: z.string().regex(/^2026-\\d{2}-\\d{2}$/, "Fecha del año 2026 requerida").refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, "Fecha inválida"),'));
