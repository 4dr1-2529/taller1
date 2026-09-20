const fs = require('node:fs');
function edit(p,fn) { fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'))); }
edit('backend/src/controllers/profesor.controller.ts',s=>s.replace(/^  lms(?:Actividades|Indicadores):.*\n/gm,'').replace('function mapStudentRow(','async function mapStudentRow(').replace('    lmsActivities: s.lmsActividades,\n    lmsEngagement: deriveLmsEngagement(s.lmsActividades, s.lmsIndicadores?.[0] ?? null),\n    lmsIndicador: s.lmsIndicadores?.[0] ?? null,','    indicators: await studentIndicators(s.id),').replaceAll('rows.map(mapStudentRow)','await Promise.all(rows.map(mapStudentRow))').replaceAll('students.map(mapStudentRow)','await Promise.all(students.map(mapStudentRow))'));
edit('frontend/src/lib/api-mappers.ts',s=> {
  s=s.replace(/^import .*lms-engagement.*\n/m,'').replace('  LmsEngagement,\n','');
  const a=s.indexOf('type ApiLmsActivity'); const b=s.indexOf('type ApiStoredPrediction'); s=s.slice(0,a)+s.slice(b);
  s=s.replace('  lmsActivities?: ApiLmsActivity[];\n  lmsIndicador?: ApiLmsIndicador | null;','  indicators?: { dias_activos: number; actividades_realizadas: number; recursos_consultados: number; tiempo_interaccion_lms: number; promedio_general: number | null; asistencia_general: number | null };');
  const c=s.indexOf('function mapEngagement'); const d=s.indexOf('function parseFactorsJson'); s=s.slice(0,c)+s.slice(d);
  s=s.replace('  const acts = row.lmsActivities ?? [];\n  const ind = row.lmsIndicador ?? null;\n  const last = acts[acts.length - 1];','  const ind = row.indicators;');
  const e=s.indexOf('  const tareasRatio'); const f=s.indexOf('  return {',e); s=s.slice(0,e)+s.slice(f);
  s=s.replace('        engagement: mapEngagement(row.lmsEngagement, acts, ind),\n        actividadSemanalPct: acts.map((a) => toNumber(a.actividadPct)),\n        minutosPorSemana: acts.map((a) => toNumber(a.minutos)),\n        tareasEntregadas,\n        tareasTotales,\n        horasPlataformaSemana: horasSemana,','        engagement: (ind?.dias_activos ?? 0) >= 18 ? "alto" : (ind?.dias_activos ?? 0) >= 10 ? "medio" : "bajo",\n        actividadSemanalPct: ind ? [ind.dias_activos * 100 / 28] : [],\n        minutosPorSemana: ind ? [ind.tiempo_interaccion_lms * 60 / 4] : [],\n        actividadesRealizadas: ind?.actividades_realizadas ?? 0,\n        recursosConsultados: ind?.recursos_consultados ?? 0,\n        horasPlataformaSemana: (ind?.tiempo_interaccion_lms ?? 0) / 4,');
  s=s.replace('  level: "bajo" | "medio" | "alto";','  level?: "bajo" | "medio" | "alto";\n  nivelRiesgo?: "bajo" | "medio" | "alto";\n  probabilidad?: number;').replace('level: lastPred.level,','level: lastPred.level ?? lastPred.nivelRiesgo ?? "bajo",');
  return s;
});
edit('frontend/src/types/academic.ts',s=>s.replace('  tareasEntregadas: number;\n  tareasTotales: number;','  actividadesRealizadas: number;\n  recursosConsultados: number;').replace('  tareasEntregadasExtra?: number;\n',''));
edit('frontend/src/services/api.ts',s=>s.replace('  tareasEntregadas: number;\n  tareasTotales: number;','  actividadesRealizadas: number;\n  recursosConsultados: number;').replace('return this.request<{ student: Student }>("/students",','return this.request<{ student: Student; credentials: { email: string; temporaryPassword: string } }>("/students",'));
edit('frontend/src/lib/export-reports.ts',s=>s.replace('Tareas: `${s.metrics.lms.tareasEntregadas}/${s.metrics.lms.tareasTotales}`','Actividades: s.metrics.lms.actividadesRealizadas,\n    Recursos: s.metrics.lms.recursosConsultados'));
edit('frontend/src/lib/student-filters.ts',s=>s.replace(/      tareasRatio:[\s\S]*?(?=      tiempoPlataforma:)/,''));
edit('frontend/src/lib/lms-engagement.ts',s=>s.replace('  tareasRatio?: number;\n','').replace('    parts.push(Math.min(100, (ind.tareasRatio ?? 0) * 100));\n',''));
edit('frontend/src/services/estudianteService.ts',s=>{
  const a=s.indexOf('  getLms:');const b=s.indexOf('\n  get',a+5);
  return s.slice(0,a)+'  getLms: () => api.call<{ indicators: Record<string, number | string | null> }>("/estudiante/lms"),\n'+s.slice(b);
});
edit('frontend/src/hooks/useAcademicData.ts',s=>s.replace('      toast.success("Estudiante registrado");','      toast.success(`Estudiante registrado. Cuenta: ${res.credentials.email}. Contraseña temporal: ${res.credentials.temporaryPassword}`, { duration: 30000 });'));
edit('backend/prisma/seed.ts',s=> {
  const a=s.indexOf('const ML_FEATURES ='); const b=s.indexOf('\n];',a);
  return s.slice(0,a)+`const ML_FEATURES = [
  { codigo: "promedio_general", nombre: "Promedio general", tipoDato: "decimal", rangoMin: 0, rangoMax: 20, orden: 1 },
  { codigo: "cursos_desaprobados", nombre: "Cursos desaprobados", tipoDato: "integer", rangoMin: 0, rangoMax: 100, orden: 2 },
  { codigo: "asistencia_general", nombre: "Asistencia general", tipoDato: "decimal", rangoMin: 0, rangoMax: 100, orden: 3 },
  { codigo: "frecuencia_acceso_lms", nombre: "Accesos por semana", tipoDato: "decimal", rangoMin: 0, rangoMax: 10000, orden: 4 },
  { codigo: "tiempo_interaccion_lms", nombre: "Horas observadas en 28 días", tipoDato: "decimal", rangoMin: 0, rangoMax: 672, orden: 5 },
  { codigo: "actividades_realizadas", nombre: "Actividades completadas", tipoDato: "integer", rangoMin: 0, rangoMax: 10000, orden: 6 },
  { codigo: "recursos_consultados", nombre: "Materiales distintos", tipoDato: "integer", rangoMin: 0, rangoMax: 10000, orden: 7 },
`+s.slice(b);
});
