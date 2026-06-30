/**
 * Exporta cuentas reales de la BD local (correo de login = tabla usuario).
 * Uso: tsx scripts/export-demo-accounts.ts
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildStudentAccountEmail,
} from "../src/utils/person-accounts.js";
import { requireDemoPassword } from "./demo-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../docs/cuentas-demo");
const PASSWORD = requireDemoPassword();
const prisma = new PrismaClient();

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

async function main() {
  const director = await prisma.user.findFirst({
    where: { email: "director@blenkir.edu.pe" },
    select: { email: true, nombres: true, apellidos: true },
  });

  const teachers = await prisma.teacher.findMany({
    where: { activo: true },
    orderBy: { codigo: "asc" },
    select: {
      codigo: true,
      nombres: true,
      apellidos: true,
      email: true,
      especialidad: true,
      usuario: { select: { email: true } },
    },
  });

  const students = await prisma.student.findMany({
    where: { activo: true },
    orderBy: { codigo: "asc" },
    select: {
      codigo: true,
      nombres: true,
      apellidos: true,
      email: true,
      dni: true,
      usuario: { select: { email: true } },
      seccion: { select: { nombre: true, grado: { select: { numero: true } } } },
    },
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "local-database",
    password: PASSWORD,
    director: director
      ? { ...director, rol: "Director" }
      : { email: "director@blenkir.edu.pe", rol: "Director" },
    teachers: teachers.map((t) => ({
      codigo: t.codigo,
      nombres: t.nombres,
      apellidos: t.apellidos,
      email: t.usuario?.email ?? t.email,
      especialidad: t.especialidad,
      tipo: t.especialidad?.startsWith("Tutor") ? "Tutor 1°-2°" : "Polidocencia 3°-6°",
      password: PASSWORD,
    })),
    students: students.map((s) => {
      const loginEmail =
        s.usuario?.email ??
        buildStudentAccountEmail(s.nombres, s.apellidos, s.dni ?? "00000000", s.email);
      return {
        codigo: s.codigo,
        nombres: s.nombres,
        apellidos: s.apellidos,
        email: loginEmail,
        salon: s.seccion ? `${s.seccion.grado.numero}° ${s.seccion.nombre}` : "—",
        password: PASSWORD,
      };
    }),
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "cuentas.json"), JSON.stringify(payload, null, 2), "utf8");

  const teacherCsv = [
    "codigo,tipo,nombres,apellidos,email_login,password,especialidad",
    ...payload.teachers.map((t) =>
      [t.codigo, t.tipo, t.nombres, t.apellidos, t.email, PASSWORD, t.especialidad].map(csvEscape).join(","),
    ),
  ].join("\n");

  const studentCsv = [
    "codigo,salon,nombres,apellidos,email_login,password",
    ...payload.students.map((s) =>
      [s.codigo, s.salon, s.nombres, s.apellidos, s.email, PASSWORD].map(csvEscape).join(","),
    ),
  ].join("\n");

  fs.writeFileSync(path.join(outDir, "profesores.csv"), teacherCsv, "utf8");
  fs.writeFileSync(path.join(outDir, "estudiantes.csv"), studentCsv, "utf8");

  console.log(`Exportado — ${teachers.length} profesores · ${students.length} estudiantes`);
  console.log(`Carpeta: ${outDir}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
