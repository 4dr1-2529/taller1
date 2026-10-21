import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/**
 * Regresión H-3 (Sprint 4): el contador de estudiantes debe resincronizarse
 * con los datos confirmados por el backend tras un alta exitosa.
 *
 * El entorno de tests no incluye DOM (sin jsdom / testing-library), así que
 * la regresión se verifica sobre el código fuente de la vista, el hook y la
 * página que los conecta (mismo enfoque que view-coherence.test.ts).
 */
function source(rel: string): string {
  const candidates = [
    path.join(process.cwd(), "src", rel),
    path.join(process.cwd(), "frontend", "src", rel),
  ];
  const found = candidates.find((c) => existsSync(c));
  assert.ok(found, `No se encontro ${rel}`);
  return readFileSync(found!, "utf8");
}

const view = source("components/views/StudentsView.tsx");
const hook = source("hooks/useAcademicData.ts");
const page = source("app/(shell)/page.tsx");

test("alta exitosa: la vista fuerza el refetch del servidor (filas + contador)", () => {
  // El handler de creación debe reaccionar al resultado de onAddStudent y
  // recargar reloadKey solo cuando no hubo error (ok !== false).
  assert.match(
    view,
    /Promise\.resolve\(onAddStudent\(e\)\)[\s\S]*?ok !== false[\s\S]*?setReloadKey/,
    "StudentsView debe incrementar reloadKey tras un alta confirmada",
  );
  // El encabezado "Estudiantes (N)" proviene del total del servidor, no del
  // append client-side: es el valor que debe quedar sincronizado.
  assert.match(view, /title=\{`Estudiantes \(\$\{total\}\)`\}/, "el contador debe mostrarse desde el total del servidor");
});

test("error de alta: no se incrementa el contador ni se limpia el formulario", () => {
  // handleAddStudent propaga el booleano de addStudent y solo resetea el
  // formulario cuando el backend confirmó el alta.
  assert.match(
    page,
    /async function handleAddStudent\([^)]*\): Promise<boolean>/,
    "handleAddStudent debe devolver el resultado del alta",
  );
  const fn = /async function handleAddStudent[\s\S]*?\n  \}/.exec(page);
  assert.ok(fn, "no se encontro el cuerpo de handleAddStudent");
  assert.match(fn[0], /const ok = await addStudent\(newStudent\);/, "debe capturar el resultado del alta");
  assert.match(fn[0], /if \(ok\) setNewStudent\(defaultStudentForm\);/, "el formulario solo se limpia en éxito");
  assert.match(fn[0], /return ok;/, "el resultado debe propagarse a la vista");
});

test("sin duplicados: la vista prioriza las filas del servidor tras el refetch", () => {
  // rows usa serverRows del fetch del servidor cuando existe; el append
  // client-side del hook solo alimenta el fallback local.
  assert.match(view, /const rows = serverRows \?\? filtered/, "las filas deben preferir el estado del servidor");
  // El append client-side existe pero no duplica: se agrega una sola vez el
  // estudiante devuelto por el POST.
  assert.match(hook, /setStudents\(\(prev\) => \[\.\.\.prev, created\]\);/, "el alta agrega exactamente un registro al estado local");
});

test("validación de nombres se mantiene antes del POST del alta", () => {
  // addStudent valida con validateStudentForm (que incluye validatePersonName:
  // solo letras) antes de llamar a api.createStudent.
  const addFn = /async function addStudent[\s\S]*?\n  \}/.exec(hook);
  assert.ok(addFn, "no se encontro addStudent");
  assert.match(addFn[0], /validateStudentForm\(form\)/, "el alta debe validar el formulario");
  const body = addFn[0];
  assert.ok(
    body.indexOf("validateStudentForm") < body.indexOf("api.createStudent"),
    "la validacion debe ocurrir antes del POST",
  );
});
