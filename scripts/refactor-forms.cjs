const fs = require('node:fs');
function edit(p, fn) { fs.writeFileSync(p, fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'))); }
edit('frontend/src/components/views/StudentsView.tsx', s => {
  s = s.replace('UserPlus, Shuffle','UserPlus').replace('LmsEngagement, Student, StudentStatus','Student');
  s = s.replace(/^  (?:CodigoInput|GradeInput|PercentInput),\n/gm,'').replace(/^import .*peruvian-names.*\n/m,'');
  s = s.replace(/^  (?:codigo|estado|promedioGeneral|asistenciaGeneral|engagement): .*\n/gm,'');
  s = s.replace(/  function fillRandomPeruvianNames\(\) \{[\s\S]*?\n  \}\n/,'');
  s = s.replace(/<FormField label="Código"[\s\S]*?<\/FormField>/,'<FormField label="Código automático"><input className={INPUT_CLASS} value="EST-… (asignado al registrar)" readOnly /></FormField>');
  s = s.replace(/              <div className="form-grid-full flex flex-wrap[\s\S]*?<\/div>\n/,'');
  s = s.replace(/              <FormField label="Promedio[\s\S]*?(?=              <button type="submit")/,'');
  s = s.replace('title="Registrar estudiante"','title="Registrar estudiante 2026"').replace('Los indicadores alimentan el modelo de riesgo de deserción.', 'La matrícula y la cuenta se crean al registrar.');
  s = s.replace('8 dígitos — necesario para crear cuenta (o use correo)','8 dígitos obligatorios');
  s = s.replace('Ejecute `npm run db:seed` para cargar niveles, grados y secciones.', 'No hay secciones disponibles. Configure la estructura académica.');
  return s;
});
edit('frontend/src/lib/validation.ts', s => {
  const a = s.indexOf('export type StudentFormInput'); const b = s.indexOf('export type TeacherFormInput');
  let part = s.slice(a,b).replace(/^  (?:codigo|promedioGeneral|asistenciaGeneral): string;\n/gm,'').replace(/  const codigo = validateCodigo\(form.codigo\);\n  if \(codigo\) errors.codigo = codigo;\n/,'').replace('validateDni(form.dni, false)','validateDni(form.dni, true)');
  const c = part.indexOf('  if (form.promedioGeneral.trim())');
  part = part.slice(0,c) + '  return errors;\n}\n\n';
  s = s.slice(0,a) + part + s.slice(b);
  const d = s.indexOf('export function validateTeacherForm'); const e = s.indexOf('export type TeacherProfileInput');
  let teacher = s.slice(d,e).replace(/  const codigo = validateCodigo\(form.codigo\);\n  if \(codigo\) errors.codigo = codigo;\n/,'  const dni = validateDni(form.dni, true);\n  if (dni) errors.dni = dni;\n');
  return (s.slice(0,d) + teacher + s.slice(e)).replace('export type TeacherFormInput = {\n  codigo: string;', 'export type TeacherFormInput = {\n  dni: string;');
});
edit('frontend/src/hooks/useAcademicData.ts', s => {
  s = s.replace(/    const promedioParsed = form.promedioGeneral[\s\S]*?(?=    try \{)/,'');
  s = s.replace(/^        codigo: form.codigo.trim\(\),\n/gm,'');
  s = s.replace(/^        (?:estado: mapEstadoToApi\(form.estado\)|promedioGeneral: metrics.promedioGeneral|asistenciaGeneral: metrics.asistenciaGeneral|lmsEngagement: form.engagement),\n/gm,'');
  s = s.replace('await api.createTeacher({','await api.createTeacher({\n        dni: form.dni,').replace(/^        cursos: cursos.length \? cursos : undefined,\n/m,'');
  return s;
});
edit('frontend/src/app/(shell)/page.tsx', s => s.replace('!newStudent.codigo || ',''));
edit('frontend/src/components/views/TeachersView.tsx', s => {
  s = s.replace('export type NewTeacherForm = {\n  codigo: string;', 'export type NewTeacherForm = {\n  dni: string;');
  s = s.replace('export const defaultTeacherForm: NewTeacherForm = {\n  codigo: "",', 'export const defaultTeacherForm: NewTeacherForm = {\n  dni: "",');
  s = s.replace(/                  <CodigoInput\n                    placeholder="DOC-001"[\s\S]*?                  \{formErrors.codigo[^\n]*\n/, '<input className={INPUT_CLASS} value="PROF-… (automático)" readOnly />\n');
  s = s.replace(/                <label className="block text-sm">\n                  <span[^\n]*>Nombres<\/span>/, '<label className="block text-sm">DNI<input className={INPUT_CLASS} value={form.dni} onChange={e => setForm(p => ({ ...p, dni: e.target.value.replace(/\\D/g, "").slice(0,8) }))} inputMode="numeric" pattern="[0-9]{8}" required /></label>\n                <label className="block text-sm">\n                  <span>Nombres</span>');
  s = s.replace(/              <CourseFields[\s\S]*?\/>/g, '');
  s = s.replace(/<CourseRowsEditor[\s\S]*?\/>/g,'');
  s = s.replace('Perfil, cursos por grado y sección, y cuenta de acceso (correo + contraseña).','Registre el perfil y la cuenta. Luego utilice Asignaciones docentes.');
  return s.replaceAll('Eliminar','Desactivar');
});
edit('backend/src/routes/index.ts', s => {
  s = 'import { listLearning, publishMaterial, publishActivity, accessMaterial, progressActivity, courseAccess, getIndicators } from "../controllers/lms.controller.js";\n' + s;
  const routes = `
router.get("/learning", authenticate, listLearning);
router.post("/materials", authenticate, authorize("docente"), publishMaterial);
router.get("/materials/:id", authenticate, accessMaterial);
router.post("/activities", authenticate, authorize("docente"), publishActivity);
router.patch("/activities/:id/progress", authenticate, authorize("estudiante"), progressActivity);
router.post("/lms/course-access", authenticate, authorize("estudiante"), courseAccess);
router.get("/lms/students/:id", authenticate, getIndicators);
`;
  return s.replace('export default router;', routes + '\nexport default router;');
});
edit('backend/src/controllers/auth.controller.ts', s => ('import { recordLmsEvent } from "../services/lms.service.js";\n' + s).replace('    sendSuccess(res, { token,', '    await recordLmsEvent({ sub: String(user.id), role }, "login");\n    sendSuccess(res, { token,').replace('    sendSuccess(res, { loggedOut: true });', '    await recordLmsEvent(req.user!, "logout");\n    sendSuccess(res, { loggedOut: true });').replace('        expiresAt: { gt: new Date() },','        expiresAt: { gt: new Date() },\n        revocada: false,'));
