import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/**
 * Pruebas de coherencia de vistas. El entorno de tests no incluye DOM
 * (sin jsdom / testing-library), por lo que estas regresiones se verifican
 * sobre el código fuente de las vistas: qué estados renderizan y qué
 * controles exponen.
 */
function viewSource(rel: string): string {
  const candidates = [
    path.join(process.cwd(), "src", rel),
    path.join(process.cwd(), "frontend", "src", rel),
  ];
  const found = candidates.find((c) => existsSync(c));
  assert.ok(found, `No se encontró la vista ${rel}`);
  return readFileSync(found!, "utf8");
}

const ERROR_VIEWS = [
  "components/student/StudentPredictionView.tsx",
  "components/student/StudentGradesView.tsx",
  "components/student/StudentAttendanceView.tsx",
  "components/views/ProfessorAttendanceView.tsx",
  "components/views/ProfessorGradesView.tsx",
];

test("ninguna vista convierte un fallo de API en estado vacío", () => {
  for (const rel of ERROR_VIEWS) {
    const src = viewSource(rel);
    assert.match(src, /ErrorState/, `${rel} debe usar ErrorState`);
    assert.doesNotMatch(
      src,
      /\.catch\(\(\) => (null|\[\]|""|\{\})\)/,
      `${rel} no debe ocultar el error con un catch silencioso`,
    );
    assert.doesNotMatch(src, /catch\s*\{\s*\n?\s*set(Items|Students)\(\[\]\);/, `${rel} no debe traducir errores a listas vacías`);
  }
});

test("StudentPredictionView distingue error de predicción inexistente", () => {
  const src = viewSource("components/student/StudentPredictionView.tsx");
  assert.match(src, /predError/, "debe existir el estado de error de la predicción");
  assert.match(src, /alertasError/, "debe existir el estado de error de las alertas");
  assert.match(src, /ESTUDIANTE_MSG\.sinPrediccion/, "la predicción inexistente real sigue mostrándose");
});

test("StudentAttendanceView limpia el resumen si la nueva consulta falla", () => {
  const src = viewSource("components/student/StudentAttendanceView.tsx");
  assert.match(src, /setResumen\(EMPTY_RESUMEN\)/, "los KPIs antiguos no deben sobrevivir a un error");
});

test("Mis alertas del estudiante es sólo lectura", () => {
  const src = viewSource("components/student/StudentAlertsView.tsx");
  assert.match(src, /estudianteService\.getAlertas\(\)/, "consume GET /estudiante/alertas");
  assert.doesNotMatch(src, /<button/, "no debe exponer ningún botón (ni Resolver ni cambiar estado)");
  assert.doesNotMatch(src, /method:\s*"POST"|method:\s*"PUT"|method:\s*"PATCH"/, "no debe escribir en el backend");
  assert.doesNotMatch(src, /profesorService|directorService/, "no debe depender de servicios de gestión");
  for (const accion of ["Resolver", "Cambiar estado"]) {
    assert.doesNotMatch(src, new RegExp(accion), `no debe mostrar la acción "${accion}"`);
  }
});

test("Mis alertas del estudiante está montada en la sección Alertas", () => {
  const shell = viewSource("app/(shell)/page.tsx");
  assert.match(shell, /import { StudentAlertsView }/);
  assert.match(shell, /if \(isEstudiante\) return <StudentAlertsView \/>/);
});

test("el historial del profesor consulta un snapshot de los filtros visibles", () => {
  const src = viewSource("components/views/PredictionHistoryView.tsx");
  assert.match(src, /resolveHistorySearchFilters\(pf\.draft\)/, "debe tomar el snapshot del borrador");
  assert.match(src, /void load\(snapshot\)/, "load debe recibir ese snapshot");
});

test("la auditoría no anida una tabla dentro de TableWrap", () => {
  const src = viewSource("components/views/AuditView.tsx");
  assert.doesNotMatch(src, /<TableWrap>[\s\S]*?<table/, "TableWrap ya renderiza <table>");
  assert.match(src, /reloadKey/, "el reintento debe forzar una consulta nueva");
});

test("el director consulta notas y asistencia; sólo el profesor registra", () => {
  const grades = viewSource("components/views/GradesView.tsx");
  assert.match(
    grades,
    /isDocente && <PageSection/,
    "el formulario 'Registrar nota' debe renderizarse sólo para docente",
  );
  const attendance = viewSource("components/views/AttendanceView.tsx");
  assert.match(
    attendance,
    /filters\.seccionId && isDocente \?/,
    "la asistencia masiva debe renderizarse sólo para docente",
  );
});

test("las búsquedas de servidor de alertas, matrículas y asistencia están debounced", () => {
  const alerts = viewSource("components/views/AlertsView.tsx");
  assert.match(alerts, /useDebouncedValue\(filters\.search, 320\)/);
  const enrollments = viewSource("components/views/EnrollmentsView.tsx");
  assert.match(enrollments, /useDebouncedValue\(query, 320\)/);
  assert.match(enrollments, /q: searchQuery\.trim\(\)/);
  const attendance = viewSource("components/views/AttendanceView.tsx");
  assert.match(attendance, /useDebouncedValue\(filters\.search, 320\)/);
  assert.match(attendance, /q: searchQuery\.trim\(\)/);
});
