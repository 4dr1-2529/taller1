/**
 * Genera canvas interactivo con cuentas demo para Cursor.
 * Uso: node scripts/generate-accounts-canvas.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.resolve(__dirname, "../../docs/cuentas-demo/cuentas.json");
const canvasDir = path.resolve(
  __dirname,
  "../../../../.cursor/projects/c-Users-HP-Music-proyecto-de-taller/canvases",
);
const canvasPath = path.join(canvasDir, "cuentas-demo.canvas.tsx");

if (!fs.existsSync(jsonPath)) {
  console.error("Falta docs/cuentas-demo/cuentas.json — ejecute: node scripts/export-demo-accounts.mjs");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

fs.mkdirSync(canvasDir, { recursive: true });

const inlineData = JSON.stringify({
  generatedAt: data.generatedAt,
  password: data.password,
  director: data.director,
  teachers: data.teachers,
  students: data.students,
});

const source = `import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  H1,
  H2,
  Row,
  Select,
  Stack,
  Stat,
  Table,
  Text,
  TextInput,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

const DATA = ${inlineData} as const;

type Tab = "profesores" | "estudiantes";

function matchQuery(q: string, parts: (string | null | undefined)[]) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return parts.some((p) => String(p ?? "").toLowerCase().includes(needle));
}

export default function CuentasDemoCanvas() {
  useHostTheme();
  const [tab, setTab] = useCanvasState<Tab>("tab", "profesores");
  const [query, setQuery] = useCanvasState("query", "");
  const [salon, setSalon] = useCanvasState("salon", "todos");

  const salones = Array.from(new Set(DATA.students.map((s) => s.salon))).sort((a, b) => {
    const [ga, sa] = a.split("° ");
    const [gb, sb] = b.split("° ");
    const ng = Number(ga) - Number(gb);
    return ng !== 0 ? ng : sa.localeCompare(sb);
  });

  const tutors = DATA.teachers.filter((t) => t.tipo === "Tutor 1°-2°");
  const poli = DATA.teachers.filter((t) => t.tipo !== "Tutor 1°-2°");

  const filteredTeachers = DATA.teachers.filter((t) =>
    matchQuery(query, [t.codigo, t.nombres, t.apellidos, t.email, t.especialidad, t.tipo]),
  );

  const filteredStudents = DATA.students.filter((s) => {
    if (salon !== "todos" && s.salon !== salon) return false;
    return matchQuery(query, [s.codigo, s.nombres, s.apellidos, s.email, s.salon]);
  });

  const visibleStudents = filteredStudents.slice(0, 100);

  return (
    <Stack gap={16} style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <Stack gap={6}>
        <H1>Cuentas demo — I.E.P. Blenkir</H1>
        <Text tone="secondary" size="small">
          Generado: {new Date(DATA.generatedAt).toLocaleString("es-PE")} · Contraseña:{" "}
          <Code>{DATA.password}</Code>
        </Text>
      </Stack>

      <Row gap={12} style={{ flexWrap: "wrap" }}>
        <Stat label="Profesores" value={String(DATA.teachers.length)} />
        <Stat label="Tutores 1°-2°" value={String(tutors.length)} tone="success" />
        <Stat label="Polidocencia" value={String(poli.length)} />
        <Stat label="Estudiantes" value={String(DATA.students.length)} tone="warning" />
      </Row>

      <Card>
        <CardHeader title="Director" />
        <CardBody>
          <Table
            striped
            headers={["Rol", "Nombre", "Correo", "Contraseña"]}
            rows={[
              [
                DATA.director.rol,
                DATA.director.nombres + " " + DATA.director.apellidos,
                DATA.director.email,
                DATA.password,
              ],
            ]}
          />
        </CardBody>
      </Card>

      <Row gap={8} style={{ flexWrap: "wrap", alignItems: "center" }}>
        <Select
          label="Vista"
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          options={[
            { value: "profesores", label: "Profesores (23)" },
            { value: "estudiantes", label: "Estudiantes (660)" },
          ]}
        />
        <TextInput
          label="Buscar"
          placeholder="Nombre, correo o codigo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 260, flex: 1 }}
        />
        {tab === "estudiantes" ? (
          <Select
            label="Salon"
            value={salon}
            onChange={setSalon}
            options={[{ value: "todos", label: "Todos los salones" }, ...salones.map((s) => ({ value: s, label: s }))]}
          />
        ) : null}
      </Row>

      {tab === "profesores" ? (
        <Stack gap={12}>
          <H2>Profesores ({filteredTeachers.length})</H2>
          <Table
            striped
            stickyHeader
            framed
            headers={["Codigo", "Tipo", "Nombre", "Correo", "Especialidad", "Contrasena"]}
            rows={filteredTeachers.map((t) => [
              t.codigo,
              t.tipo,
              t.nombres + " " + t.apellidos,
              t.email,
              t.especialidad,
              DATA.password,
            ])}
            emptyMessage="Sin resultados para la busqueda."
          />
        </Stack>
      ) : (
        <Stack gap={12}>
          <H2>
            Estudiantes ({filteredStudents.length}
            {filteredStudents.length > 100 ? ", mostrando 100" : ""})
          </H2>
          {filteredStudents.length > 100 ? (
            <Callout tone="info">
              Use busqueda o filtro por salon. Archivo completo: docs/cuentas-demo/estudiantes.csv
            </Callout>
          ) : null}
          <Table
            striped
            stickyHeader
            framed
            headers={["Codigo", "Salon", "Nombre", "Correo", "Contrasena"]}
            rows={visibleStudents.map((s) => [
              s.codigo,
              s.salon,
              s.nombres + " " + s.apellidos,
              s.email ?? "—",
              DATA.password,
            ])}
            emptyMessage="Sin resultados."
          />
        </Stack>
      )}

      <Text tone="tertiary" size="small">
        CSV: docs/cuentas-demo/profesores.csv · docs/cuentas-demo/estudiantes.csv
      </Text>
    </Stack>
  );
}
`;

fs.writeFileSync(canvasPath, source, "utf8");
console.log(`Canvas generado: ${canvasPath}`);
