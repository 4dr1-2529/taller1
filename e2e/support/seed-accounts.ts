/**
 * Prepara las 5 cuentas ficticias F4 para la suite E2E local (FASE 5).
 *
 * Hace UNDAMENTE sobre la BD desechable `blenkir_refactor_test`:
 *  - fija contraseñas locales conocidas en director y profesores F4
 *  - normaliza los correos de los estudiantes F4 a f4-est-a/b@example.test
 *
 * Prerrequisito: haber corrido el ciclo completo (reset -> migraciones ->
 * suite de integracion -> suite de roles) para que existan las fixtures F4.
 * La puerta inferior bloquea cualquier BD que no sea la desechable.
 */
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error(
    "DATABASE_URL no definida. Exporte TEST_DB_URL (BD desechable blenkir_refactor_test) antes de correr.",
  );
  process.exit(1);
}
if (!url.includes("blenkir_refactor_test") || /railway|production/i.test(url)) {
  console.error(
    "PROHIBIDO: DATABASE_URL no corresponde a la BD desechable blenkir_refactor_test.",
  );
  process.exit(1);
}

/**
 * Lee una variable de entorno obligatoria para credenciales de prueba E2E.
 * Nunca se admiten contraseñas hard-codeadas como fallback.
 */
function requireE2EEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Falta variable de entorno E2E "${name}". Defínala antes de ejecutar seed-accounts.ts (never hard-codear contraseñas de prueba).`,
    );
  }
  return value;
}

const E2E_USERS = [
  { email: "f4-director@example.test", password: requireE2EEnv("E2E_DIRECTOR_PASSWORD") },
  { email: "f4-prof-a@example.test", password: requireE2EEnv("E2E_PROFA_PASSWORD") },
  { email: "f4-prof-b@example.test", password: requireE2EEnv("E2E_PROFB_PASSWORD") },
];

const E2E_STUDENTS = [
  { dni: "90000501", email: "f4-est-a@example.test", password: requireE2EEnv("E2E_ESTA_PASSWORD") },
  { dni: "90000502", email: "f4-est-b@example.test", password: requireE2EEnv("E2E_ESTB_PASSWORD") },
];

async function main(): Promise<void> {
  // Import diferido: la puerta de DATABASE_URL corre antes de cargar Prisma.
  const { prisma } = await import("../../backend/src/utils/prisma.js");

  const missing: string[] = [];
  let updated = 0;

  // Los hashes y actualizaciones por usuario son independientes entre sí.
  await Promise.all(
    E2E_USERS.map(async (u) => {
      const hash = await bcrypt.hash(u.password, 4);
      const res = await prisma.user.updateMany({
        where: { email: u.email },
        data: { passwordHash: hash },
      });
      if (res.count === 1) {
        updated += 1;
        console.log(`cuenta OK ${u.email}`);
      } else {
        missing.push(u.email);
      }
    }),
  );

  // Cada estudiante se procesa de forma independiente.
  await Promise.all(
    E2E_STUDENTS.map(async (s) => {
      const student = await prisma.student.findFirst({ where: { dni: s.dni } });
      if (!student?.usuarioId) {
        missing.push(`estudiante DNI ${s.dni} (corra antes la suite de roles-login)`);
        return;
      }
      const hash = await bcrypt.hash(s.password, 4);
      await prisma.user.update({
        where: { id: student.usuarioId },
        data: { email: s.email, passwordHash: hash },
      });
      updated += 1;
      console.log(`cuenta OK ${s.email}`);
    }),
  );

  await prisma.$disconnect();

  if (missing.length > 0) {
    console.error(`Faltan fixtures: ${missing.join("; ")}`);
    process.exit(2);
  }
  console.log(
    `Listo: ${updated} cuentas E2E. Correos impresos; contrasenas: defaults de e2e/support/config.ts o variables E2E_*.`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
