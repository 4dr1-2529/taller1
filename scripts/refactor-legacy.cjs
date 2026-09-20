const fs = require('node:fs');
function edit(p,fn) { fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'))); }
function archive(p) { const target='legacy/'+p; fs.mkdirSync(require('node:path').dirname(target),{recursive:true}); fs.renameSync(p,target); }
edit('machine-learning/app/main.py',s=>s.replace('        from fastapi import HTTPException\n\n',''));
edit('backend/src/routes/index.ts',s=>s.replace('router.get("/students", authenticate, authorize("admin", "docente"),','router.get("/students", authenticate,').replace('router.get("/students/:id", authenticate, authorize("admin", "docente"),','router.get("/students/:id", authenticate,'));
edit('backend/tests/refactor-2026.integration.ts',s=>s.replace('app.use(express.json());','app.set("json replacer", (_key: string, value: unknown) => typeof value === "bigint" ? String(value) : value);\napp.use(express.json());'));
edit('backend/src/controllers/students.controller.ts',s=>{
  s='import { studentIndicators } from "../services/lms.service.js";\n'+s;
  s=s.replace(/^import .*deriveLmsEngagement.*\n/m,'').replace('const where: Record<string, unknown> = { ...scope };','const where: Record<string, unknown> = { AND: [scope] };');
  s=s.replace(/^\s*lmsActividades:.*\n/gm,'\n').replace(/^\s*lmsIndicadores:.*\n/gm,'\n');
  s=s.replace('const items = rows.map((s) => ({','const items = await Promise.all(rows.map(async (s) => ({');
  s=s.replace('      lmsActivities: s.lmsActividades,\n      lmsEngagement: deriveLmsEngagement(s.lmsActividades, s.lmsIndicadores[0] ?? null),\n      lmsIndicador: s.lmsIndicadores[0] ?? null,','      indicators: await studentIndicators(s.id),');
  s=s.replace('      alerts: s.alertas,\n    }));','      alerts: s.alertas,\n    })));');
  s=s.replace('        lmsActivities: student.lmsActividades,','        indicators: await studentIndicators(student.id),');
  return s;
});
edit('backend/src/controllers/profesor.controller.ts',s=>{
  s='import { studentIndicators } from "../services/lms.service.js";\n'+s.replace(/^import .*deriveLmsEngagement.*\n/m,'');
  const a=s.indexOf('export async function profesorLms'); const b=s.indexOf('\nexport async function',a+5);
  return s.slice(0,a)+`export async function profesorLms(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = await teacherId(req);
    const where = await buildProfesorStudentWhere(tid, parseProfesorQuery(req));
    const students = await prisma.student.findMany({ where, select: { id: true, nombres: true, apellidos: true } });
    sendSuccess(res, { items: await Promise.all(students.map(async s => ({ ...s, indicators: await studentIndicators(s.id) }))) });
  } catch (e) { next(e); }
}
`+s.slice(b);
});
edit('backend/src/controllers/predict.controller.ts',s=>s.replace(/^\s*lmsActividades:.*\n/m,'\n'));
edit('backend/src/services/estudiante.service.ts',s=> {
  s='import { studentIndicators } from "./lms.service.js";\n'+s.replace(/^import .*deriveLmsEngagement.*\n/m,'');
  const a=s.indexOf('export async function buildEstudianteLms'); const b=s.indexOf('export async function buildEstudiantePrediccion');
  s=s.slice(0,a)+'export async function buildEstudianteLms(studentId: bigint) {\n  return { profile: await loadStudentProfile(studentId), indicators: await studentIndicators(studentId) };\n}\n\n'+s.slice(b);
  s=s.replace('prisma.lmsActivity.findMany({','prisma.lmsEvent.findMany({').replace('orderBy: { anioSemana: "desc" }','orderBy: { createdAt: "desc" }');
  s=s.replace('semana: lmsActs[0].anioSemana,','semana: lmsActs[0].createdAt.toISOString(),').replace('actividadPct: Number(lmsActs[0].actividadPct),','tipo: lmsActs[0].tipo,').replace('minutos: lmsActs[0].minutos,','minutos: lmsActs[0].durationSeconds / 60,');
  return s;
});
edit('backend/src/services/dashboard-analytics.service.ts',s=>{
  s=s.replace('prisma.lmsIndicadorEstudiante.findMany({\n      where: { student: scope },','prisma.student.findMany({\n      where: scope,').replace('        frecuenciaAcceso: true,\n        student: {\n          select: {\n            seccion: {\n              select: { grado: { select: { numero: true } } },\n            },\n          },\n        },','        resourceEvents: { where: { createdAt: { gte: new Date(Date.now() - 28 * 86400000) } }, select: { createdAt: true } },\n        seccion: { select: { grado: { select: { numero: true } } } },');
  s=s.replace('row.student.seccion?.grado?.numero','row.seccion?.grado?.numero').replace('Number(row.frecuenciaAcceso)','new Set(row.resourceEvents.map(e => e.createdAt.toISOString().slice(0, 10))).size * 100 / 28');
  const a=s.indexOf('function extractFeatureImportance');
  if(a>=0) { const b=s.indexOf('\nfunction ',a+1); s=s.slice(0,a)+'function extractFeatureImportance(metrics: unknown): { variable: string; peso: number }[] {\n  const values = (metrics as { feature_importance?: Record<string, number> })?.feature_importance;\n  return values ? Object.entries(values).map(([variable, peso]) => ({ variable, peso })) : [];\n}\n'+(b<0?'':s.slice(b)); }
  return s;
});
edit('backend/src/controllers/attendance.controller.ts',s=>s.replace('const studentWhere: Record<string, unknown> = { ...scope };','const studentWhere: Record<string, unknown> = { AND: [scope] };'));
edit('backend/src/controllers/admin.controller.ts',s=>s.replace('      await prisma.user.delete({ where: { id } });','      await prisma.user.update({ where: { id }, data: { activo: false } });').replace('    await prisma.user.delete({ where: { id } });','    await prisma.user.update({ where: { id }, data: { activo: false } });').replace('"Usuario eliminado"','"Usuario desactivado"'));
edit('frontend/src/lib/aggregates.ts',s=>{
  s=s.replace('import { computePrediction } from "@/lib/risk-engine";','').replace('import { toRiskEngineStatus } from "@/lib/status";','').replace('ReturnType<typeof computePrediction>','{ score: number; level: RiskLevel; probability: number; factors: RiskFactor[]; modelName: string }');
  s=s.replace('  if (!sp) return computePrediction(s.metrics, toRiskEngineStatus(s.estado));','  if (!sp) throw new Error("Predicción no disponible");').replace('  const fallback = computePrediction(s.metrics, toRiskEngineStatus(s.estado));\n','').replace('factors: factors.length ? factors : fallback.factors','factors').replace('sp.modelName ?? fallback.modelName','sp.modelName ?? "Modelo registrado"').replace('return students.map((s) => ({','return students.filter(s => s.storedPrediction).map((s) => ({');
  return s.replace('(sum / withPred.length)','(sum / (withPred.length || 1))');
});
edit('frontend/src/components/views/StudentsView.tsx',s=>s.replace('import { attachPredictions } from "@/lib/aggregates";\n','').replace('const withPred = attachPredictions(students);','const withPred = students;').replace('<RiskBadge level={student.prediction.level} score={student.prediction.score} />','{student.storedPrediction ? <RiskBadge level={student.storedPrediction.level} score={student.storedPrediction.score} /> : <span>Sin predicción</span>}'));
edit('frontend/src/hooks/useAcademicData.ts',s=>s.replace(/^  (?:mapEstadoToApi|parseGrade|parsePercent),\n/gm,'').replace(/^import .*student-factory.*\n/m,''));
edit('frontend/src/app/(shell)/page.tsx',s=>s.replace(/^import \{ (?:StudentLMSView|StudentMensajeriaView|LMSView|ProfessorLMSView) \}.*\n/gm,''));
edit('frontend/src/components/views/TeachersView.tsx',s=> {
  const a=s.indexOf('\nfunction CourseBlock'); if(a>=0)s=s.slice(0,a);
  s=s.replace(/^const emptyCourse = .*\n/m,'');
  for(const name of ['updateCourse','updateEditCourse']) { const a=s.indexOf('  function '+name+'('); if(a>=0){const b=s.indexOf('\n  }',a);s=s.slice(0,a)+s.slice(b+5);} }
  return s;
});
for(const p of ['frontend/src/components/views/LMSView.tsx','frontend/src/components/views/ProfessorLMSView.tsx','frontend/src/components/student/StudentLMSView.tsx','frontend/src/components/student/StudentMensajeriaView.tsx','frontend/src/lib/student-factory.ts','frontend/src/lib/peruvian-names.ts','frontend/src/lib/risk-engine.ts','backend/src/services/risk-engine.ts','backend/src/utils/lms-engagement.ts']) archive(p);
// Preserve historical LMS tables in the schema, but remove them from generated runtime APIs.
edit('backend/prisma/schema.prisma',s=> {
  for(const name of ['LmsActivity','LmsEntregaTarea','LmsIndicadorEstudiante']) {
    const re=new RegExp('model '+name+' \\{([\\s\\S]*?)\\n\\}');
    s=s.replace(re, '/// LEGACY: retained only for historical data; not used by the 2026 application.\nmodel '+name+' {$1\n  @@ignore\n}');
    s=s.replace(new RegExp('^(  \\w+\\s+'+name+'\\[\\])\\s*$','gm'),'$1 @ignore');
  }
  return s;
});
