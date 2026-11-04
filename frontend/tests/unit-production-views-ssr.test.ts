import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachersView, defaultTeacherForm } from "../src/components/views/TeachersView.js";
import { StudentsView, defaultStudentForm } from "../src/components/views/StudentsView.js";

const noOp = () => undefined;
const sections = [{ id: "sec-1", label: "Primaria · 2° A", gradoId: "grade-2", numero: 2, nombre: "A" }] as any;

function renderTeachers({ canEdit = true, teachers = [] }: { canEdit?: boolean; teachers?: any[] } = {}) {
  return renderToStaticMarkup(createElement(TeachersView, {
    teachers,
    secciones: sections,
    form: { ...defaultTeacherForm, crearCuenta: false },
    setForm: noOp,
    onSubmit: noOp,
    onUpdate: async () => undefined,
    onDeactivate: async () => undefined,
    onCreateAccount: async () => undefined,
    canEdit,
  }));
}

function renderStudents({ canEdit = true, students = [], secciones: sectionOptions = sections }: { canEdit?: boolean; students?: any[]; secciones?: any[] } = {}) {
  return renderToStaticMarkup(createElement(StudentsView, {
    students,
    secciones: sectionOptions,
    newStudent: defaultStudentForm,
    setNewStudent: noOp,
    onAddStudent: noOp,
    canEdit,
  }));
}

test("TeachersView muestra el formulario autorizado, la búsqueda y estado vacío", () => {
  const editable = renderTeachers();
  const readOnly = renderTeachers({ canEdit: false });
  assert.ok(editable.includes("Gestión de profesores"));
  assert.ok(editable.includes("Registrar docente"));
  assert.ok(editable.includes("Guardar docente"));
  assert.ok(editable.includes("Buscar por nombre, código"));
  assert.ok(editable.includes("Sin docentes registrados."));
  assert.ok(!readOnly.includes("Registrar docente"));
  assert.ok(readOnly.includes("Plantilla docente (0)"));
});

test("TeachersView presenta docentes, cuenta de acceso y acciones según permisos", () => {
  const teacher = {
    id: "t-1", codigo: "DOC-001", nombres: "María", apellidos: "Rojas",
    especialidad: "Matemática", correo: "maria@example.edu", telefono: "987654321",
    userId: "u-1", courses: [],
  };
  const editable = renderTeachers({ teachers: [teacher] });
  const readOnly = renderTeachers({ teachers: [teacher], canEdit: false });
  assert.ok(editable.includes("María Rojas") && editable.includes("DOC-001"));
  assert.ok(editable.includes("Con cuenta de acceso"));
  assert.ok(editable.includes("Editar") && editable.includes("Desactivar"));
  assert.ok(readOnly.includes("María Rojas"));
  assert.ok(!readOnly.includes("Desactivar"));
});

test("StudentsView presenta formulario editable o tabla de solo lectura y estado sin datos", () => {
  const editable = renderStudents({ secciones: [] });
  const readOnly = renderStudents({ canEdit: false });
  assert.ok(editable.includes("Registrar estudiante 2026"));
  assert.ok(editable.includes("No hay secciones disponibles"));
  assert.ok(editable.includes("Agregar estudiante"));
  assert.ok(editable.includes("No hay estudiantes registrados."));
  assert.ok(!readOnly.includes("Registrar estudiante 2026"));
  assert.ok(!readOnly.includes("Acciones"));
  assert.ok(readOnly.includes("Estudiantes (0)"));
});

test("StudentsView renderiza métricas con datos, sin fabricar promedio o riesgo faltante", () => {
  const student = {
    id: "s-1", codigo: "EST-001", dni: "12345678", nombres: "Ana", apellidos: "Lima",
    nivel: "Primaria · 2° A", correo: "", telefono: "", estado: "activo", hasGrades: true,
    hasAttendance: true,
    metrics: {
      promedioGeneral: 15.25, asistenciaGeneral: 89,
      lms: { engagement: "alto", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 },
    },
  };
  const withPrediction = renderStudents({ students: [{ ...student, storedPrediction: { score: 72, level: "alto" } }] });
  const withoutPrediction = renderStudents({ students: [student], canEdit: false });
  assert.ok(withPrediction.includes("Ana Lima") && withPrediction.includes("EST-001"));
  assert.ok(withPrediction.includes("15.3") && withPrediction.includes("89%"));
  assert.ok(withoutPrediction.includes("Sin predicción"));
  assert.ok(!withoutPrediction.includes("Editar"));
});
