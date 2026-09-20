const fs = require('node:fs');
function edit(p,fn) { fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'))); }
edit('frontend/src/data/navigation.ts',s=>s.replace('  "Dashboard",','  "Dashboard",\n  "Materiales",\n  "Actividades",\n  "Avisos",'));
edit('frontend/src/data/sidebar-nav.ts',s=>s.replace('"Actividad LMS"],','"Actividad LMS", "Materiales", "Actividades"],').replace('"Mensajería Académica", "Reportes"','"Mensajería Académica", "Avisos", "Reportes"').replace('  Dashboard: [','  Materiales: ["Académico", "Materiales"],\n  Actividades: ["Académico", "Actividades"],\n  Avisos: ["Comunicación", "Avisos"],\n  Dashboard: ['));
edit('frontend/src/data/section-labels.ts',s=>s.replace('  Dashboard: "Dashboard",','  Dashboard: "Dashboard",\n  Materiales: "Materiales",\n  Actividades: "Actividades",\n  Avisos: "Avisos",').replace('"Mensajería Académica": "Mensajería Académica"','"Mensajería Académica": "Mensajes"').replace('Matrículas: "Matrículas"','Matrículas: "Matrícula 2026"'));
edit('frontend/src/components/AppSidebar.tsx',s=>s.replace('  Dashboard: LayoutDashboard,','  Dashboard: LayoutDashboard,\n  Materiales: BookOpen,\n  Actividades: ClipboardList,\n  Avisos: MessageCircle,'));
edit('frontend/src/app/(shell)/page.tsx',s=> {
  s=s.replace('import { api }', 'import { LearningView } from "@/components/views/LearningView";\nimport { ObservedProgressView } from "@/components/views/ObservedProgressView";\nimport { api }');
  s=s.replaceAll('    "Mensajería Académica",','    "Mensajería Académica",\n    "Avisos",\n    "Materiales",\n    "Actividades",');
  s=s.replace('  estudiante: [\n    "Dashboard",','  estudiante: [\n    "Dashboard",\n    "Cursos",');
  s=s.replace('      case "Cursos":\n        return (','      case "Cursos":\n        if (isEstudiante) return <LearningView key="courses" mode="courses" />;\n        return (');
  const a=s.indexOf('      case "Actividad LMS":',s.indexOf('function renderSection')); const b=s.indexOf('      case "Predicción":',a);
  s=s.slice(0,a)+'      case "Actividad LMS":\n        return <ObservedProgressView />;\n      case "Materiales": return <LearningView key="materials" mode="materials" />;\n      case "Actividades": return <LearningView key="activities" mode="activities" />;\n      case "Avisos": return <MensajeriaAcademicaView key="announcements" mode="announcements" />;\n'+s.slice(b);
  return s.replace('return isEstudiante ? <StudentMensajeriaView /> : <MensajeriaAcademicaView />;', 'return <MensajeriaAcademicaView key="messages" mode="messages" />;');
});
edit('frontend/src/components/views/MensajeriaAcademicaView.tsx',s=> {
  s=s.replace('({ useApi = true }: { useApi?: boolean })','({ useApi = true, mode = "messages" }: { useApi?: boolean; mode?: "messages" | "announcements" })');
  s=s.replace('      setRooms(res.rooms);\n      if (res.rooms[0] && !roomId) setRoomId(res.rooms[0].roomId);','      const visible = res.rooms.filter(r => mode === "messages" ? r.scope === "directo" : r.scope !== "directo");\n      setRooms(visible);\n      if (visible[0] && !roomId) setRoomId(visible[0].roomId);');
  s=s.replace('  }, [roomId]);','  }, [roomId, mode]);');
  s=s.replace('  const canReply = user?.role === "estudiante" || user?.role === "docente" || user?.role === "admin";', '  const selected = rooms.find(r => r.roomId === roomId);\n  const canReply = selected?.scope === "directo" || (mode === "announcements" && selected?.scope === "curso" && user?.role === "docente");');
  s=s.replace('title="Mensajería Académica"','title={mode === "messages" ? "Mensajes" : "Avisos"}').replace('description="Comunicados institucionales, avisos de curso y mensajes directos profesor–estudiante."','description={mode === "messages" ? "Conversaciones con personas vinculadas a su rol." : "Publicaciones de solo lectura. Para conversar utilice Mensajes."}');
  s=s.replace('{user?.role === "admin" && (','{mode === "announcements" && user?.role === "admin" && (');
  return s;
});
edit('frontend/src/components/views/TeachersView.tsx',s=>s.replace(/\s*<CourseBlock[\s\S]*?\/>/g,''));
edit('frontend/src/components/views/GradesView.tsx',s=>s.replace('          <PageSection\n            variant="form"','          {isDocente && <PageSection\n            variant="form"').replace('            </form>\n          </PageSection>','            </form>\n          </PageSection>}'));
edit('frontend/src/components/views/AttendanceView.tsx',s=>s.replace(') : filters.seccionId ? (',') : filters.seccionId && isDocente ? ('));
edit('backend/src/utils/student-scope.ts',s=>s.replace('where: { id: toDbId(studentId), ...scope }','where: { AND: [{ id: toDbId(studentId) }, scope] }'));
edit('backend/src/controllers/courses.controller.ts',s=>s.replace('        activo: true,','        activo: true,\n        anioLectivo: { anio: 2026 },\n        ...(req.user?.role === "estudiante" ? { inscripciones: { some: { estado: "activa" as const, student: { usuarioId: toDbId(req.user.sub), activo: true } } } } : {}),'));
edit('backend/src/utils/course-authorization.ts',s=>s.replace('  if (!course?.seccionId', '  const enrolled = await prisma.enrollment.findFirst({ where: { studentId: toDbId(studentId), cursoOfertaId: toDbId(courseId), estado: "activa", course: { anioLectivo: { anio: 2026 } }, student: { matriculas: { some: { estado: "activa", anioLectivo: { anio: 2026 } } } } } });\n  if (!enrolled || !course?.seccionId'));
edit('backend/src/controllers/messages.controller.ts',s=>s.replace('    if (user.role === "docente") {\n      const teacher =', '    if (user.role === "docente") {\n      rooms.push({ roomId: "global:institucional", label: "Avisos globales", scope: "global" });\n      const teacher ='));
// The replacement above targets both a room helper and the list: remove any insertion into the helper.
edit('backend/src/controllers/messages.controller.ts',s=> { const a=s.indexOf('async function assertRoomAccess'); const b=s.indexOf('async function recipientUserIdsForMessage'); return s.slice(0,a)+s.slice(a,b).replace('      rooms.push({ roomId: "global:institucional", label: "Avisos globales", scope: "global" });\n','')+s.slice(b); });
