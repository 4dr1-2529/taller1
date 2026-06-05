/**
 * Valida que cada salón tenga exactamente 30 alumnos y capacidad 30.
 * Uso: node scripts/validate-demo-data.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ALUMNOS_POR_SALON = 30;

const secciones = await prisma.seccion.findMany({
  include: { grado: true, _count: { select: { estudiantes: true } } },
  orderBy: [{ grado: { numero: "asc" } }, { nombre: "asc" }],
});

let ok = true;
for (const sec of secciones) {
  const n = sec._count.estudiantes;
  if (sec.capacidad !== ALUMNOS_POR_SALON || n !== ALUMNOS_POR_SALON) {
    console.warn(
      `  ⚠ ${sec.grado.numero}° ${sec.nombre}: ${n}/${ALUMNOS_POR_SALON} alumnos · capacidad ${sec.capacidad}`,
    );
    ok = false;
  }
}

const total = await prisma.student.count();
const esperado = secciones.length * ALUMNOS_POR_SALON;

if (ok && total === esperado) {
  console.log(
    `Validación OK — ${secciones.length} salones × ${ALUMNOS_POR_SALON} = ${total} estudiantes`,
  );
} else {
  console.error(`Validación fallida — total ${total}, esperado ${esperado}`);
  process.exitCode = 1;
}

await prisma.$disconnect();
