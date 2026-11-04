import test from "node:test";
import assert from "node:assert/strict";
import { mapAssignmentRow, resolveTipoPrincipal } from "../../src/services/teacher-assignment.mappers.js";

const baseRow = {
  id: 10n,
  profesorId: 3n,
  cursoId: 5n,
  gradoId: 2n,
  seccionId: 9n,
  anioLectivoId: 1n,
  cursoOfertaId: null,
  esTutor: false,
  activo: true,
  profesor: { id: 3n, nombres: "Lucía", apellidos: "Torres", codigo: "P003" },
  curso: { id: 5n, codigo: "MAT", nombre: "Matemática" },
  grado: { id: 2n, numero: 2, nombre: "Secundaria" },
  seccion: { id: 9n, nombre: "B" },
  anioLectivo: { id: 1n, anio: 2026, nombre: "2026" },
};

test("mapAssignmentRow transforma una fila de asignación en formato API", () => {
  const result = mapAssignmentRow(baseRow);
  assert.strictEqual(result.id, "10");
  assert.strictEqual(result.profesorId, "3");
  assert.strictEqual(result.cursoOfertaId, null);
  assert.strictEqual(result.esTutor, false);
  assert.strictEqual(result.tipoAsignacion, "Docente por curso");
  assert.strictEqual(result.profesor.id, "3");
  assert.strictEqual(result.profesor.nombre, "Lucía Torres");
  assert.strictEqual(result.grado.id, "2");
  assert.strictEqual(result.grado.label, "2°");
  assert.strictEqual(result.seccion.label, "2° B");
  assert.strictEqual(result.anioLectivo.id, "1");
});

test("mapAssignmentRow con tutor de primaria es Tutor de aula", () => {
  const row = { ...baseRow, esTutor: true, grado: { ...baseRow.grado, numero: 2 } };
  const result = mapAssignmentRow(row);
  assert.strictEqual(result.tipoAsignacion, "Tutor de aula");
  assert.strictEqual(result.seccion.label, "2° B");
});

test("mapAssignmentRow con sección sin grado usa el nombre de la sección", () => {
  const row = { ...baseRow, grado: undefined, seccion: { id: 9n, nombre: "A" } };
  const result = mapAssignmentRow(row);
  assert.strictEqual(result.grado, undefined);
  assert.strictEqual(result.seccion.label, "A");
});

test("resolveTipoPrincipal lista casos de asignaciones docentes", () => {
  assert.strictEqual(resolveTipoPrincipal([]), "Docente por curso");
  assert.strictEqual(
    resolveTipoPrincipal([{ esTutor: false, grado: { numero: 3 } }]),
    "Docente por curso",
  );
  assert.strictEqual(
    resolveTipoPrincipal([{ esTutor: true, grado: { numero: 1 } }]),
    "Tutor de aula",
  );
  assert.strictEqual(
    resolveTipoPrincipal([{ esTutor: true, grado: { numero: 4 } }]),
    "Tutor y docente por curso",
  );
  assert.strictEqual(
    resolveTipoPrincipal([
      { esTutor: true, grado: { numero: 1 } },
      { esTutor: true, grado: { numero: 3 } },
    ]),
    "Tutor y docente por curso",
  );
});
