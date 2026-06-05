/**
 * Limpia inscripciones curso erróneas y deja solo matrículas institucionales (~660).
 * Uso: npm run db:reset:academic
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const [enBefore, matActivas, matTotal, students] = await Promise.all([
  prisma.enrollment.count(),
  prisma.matricula.count({ where: { estado: "activa" } }),
  prisma.matricula.count(),
  prisma.student.count({ where: { activo: true } }),
]);

const deleted = await prisma.enrollment.deleteMany({});

console.log("── Reset académico Blenkir ──");
console.log(`Inscripciones curso eliminadas: ${deleted.count} (antes: ${enBefore})`);
console.log(`Matrículas activas: ${matActivas}`);
console.log(`Matrículas totales: ${matTotal}`);
console.log(`Estudiantes activos: ${students}`);
if (matActivas !== students && matTotal > 0) {
  console.warn("Aviso: matrículas activas ≠ estudiantes. Ejecute: npm run db:seed && npm run db:seed:demo");
}

await prisma.$disconnect();
