/**
 * Elimina inscripciones masivas estudiante×curso (no son matrículas de salón).
 * Uso: node scripts/cleanup-course-enrollments.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const before = await prisma.enrollment.count();
const deleted = await prisma.enrollment.deleteMany({});
const matriculas = await prisma.matricula.count();
console.log(`Inscripciones curso: ${before} → ${deleted.count} eliminadas`);
console.log(`Matrículas institucionales conservadas: ${matriculas}`);

await prisma.$disconnect();
