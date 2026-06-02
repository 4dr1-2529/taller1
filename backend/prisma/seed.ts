/**
 * Seed LIMPIO — Solo estructura institucional peruana (sin estudiantes ni usuarios demo).
 * Primer administrador: npm run db:bootstrap (usa variables ADMIN_EMAIL / ADMIN_PASSWORD)
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISOS = [
  { codigo: "admin.full", modulo: "admin" },
  { codigo: "estudiantes.read", modulo: "estudiantes" },
  { codigo: "estudiantes.write", modulo: "estudiantes" },
  { codigo: "notas.write", modulo: "academico" },
  { codigo: "asistencia.write", modulo: "asistencia" },
  { codigo: "alertas.manage", modulo: "alertas" },
  { codigo: "ia.predict", modulo: "ia" },
  { codigo: "reportes.export", modulo: "reportes" },
];

const ROLE_PERMS: Record<UserRole, string[]> = {
  admin: PERMISOS.map((p) => p.codigo),
  docente: ["estudiantes.read", "notas.write", "asistencia.write", "alertas.manage", "ia.predict", "reportes.export"],
  estudiante: ["estudiantes.read"],
};

const CURSOS_PRIMARIA = [
  { codigo: "COM-P", nombre: "Comunicación", area: "Comunicación" },
  { codigo: "MAT-P", nombre: "Matemática", area: "Matemática" },
  { codigo: "PSO-P", nombre: "Personal Social", area: "Ciencias Sociales" },
  { codigo: "CNP-P", nombre: "Ciencia y Tecnología", area: "Ciencia" },
  { codigo: "ART-P", nombre: "Arte y Cultura", area: "Arte" },
  { codigo: "EFP-P", nombre: "Educación Física", area: "Educación Física" },
  { codigo: "ING-P", nombre: "Inglés", area: "Idiomas" },
  { codigo: "RLE-P", nombre: "Religión", area: "Religión" },
];

const CURSOS_SECUNDARIA = [
  { codigo: "COM-S", nombre: "Comunicación", area: "Comunicación" },
  { codigo: "MAT-S", nombre: "Matemática", area: "Matemática" },
  { codigo: "ING-S", nombre: "Inglés", area: "Idiomas" },
  { codigo: "ART-S", nombre: "Arte", area: "Arte" },
  { codigo: "EFS-S", nombre: "Educación Física", area: "Educación Física" },
  { codigo: "RLE-S", nombre: "Religión", area: "Religión" },
  { codigo: "CCS-S", nombre: "Ciencias Sociales", area: "Ciencias Sociales" },
  { codigo: "DPB-S", nombre: "Desarrollo Personal", area: "Tutoría" },
  { codigo: "FIS-S", nombre: "Física", area: "Ciencia", gradosMin: 3 },
  { codigo: "QUI-S", nombre: "Química", area: "Ciencia", gradosMin: 4 },
  { codigo: "BIO-S", nombre: "Biología", area: "Ciencia", gradosMin: 2 },
  { codigo: "CTA-S", nombre: "Ciencia y Tecnología", area: "Ciencia", gradosMax: 2 },
  { codigo: "ECO-S", nombre: "Economía", area: "Ciencias Sociales", gradosMin: 4 },
  { codigo: "FIL-S", nombre: "Filosofía", area: "Humanidades", gradosMin: 4 },
];

const SECCIONES = ["A", "B", "C"];

async function main() {
  console.log("Seed estructura I.E.P. Perú (sin datos demo de personas)...");

  for (const p of PERMISOS) {
    await prisma.permission.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    });
  }

  for (const [role, perms] of Object.entries(ROLE_PERMS) as [UserRole, string[]][]) {
    const roleRow = await prisma.role.upsert({
      where: { codigo: role },
      update: {},
      create: {
        codigo: role,
        nombre: role.charAt(0).toUpperCase() + role.slice(1),
        descripcion: `Rol ${role}`,
      },
    });
    for (const codigo of perms) {
      const perm = await prisma.permission.findUnique({ where: { codigo } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleRow.id, permissionId: perm.id } },
        update: {},
        create: { roleId: roleRow.id, permissionId: perm.id },
      });
    }
  }

  const primaria = await prisma.nivelEducativo.upsert({
    where: { codigo: "primaria" },
    update: {},
    create: { codigo: "primaria", nombre: "Educación Primaria" },
  });
  const secundaria = await prisma.nivelEducativo.upsert({
    where: { codigo: "secundaria" },
    update: {},
    create: { codigo: "secundaria", nombre: "Educación Secundaria" },
  });

  const catalogMap = new Map<string, string>();

  for (const c of [...CURSOS_PRIMARIA, ...CURSOS_SECUNDARIA]) {
    const row = await prisma.cursoCatalogo.upsert({
      where: { codigo: c.codigo },
      update: {},
      create: { codigo: c.codigo, nombre: c.nombre, area: c.area },
    });
    catalogMap.set(c.codigo, row.id);
  }

  for (let n = 1; n <= 6; n++) {
    const grado = await prisma.grado.upsert({
      where: { nivelId_numero: { nivelId: primaria.id, numero: n } },
      update: {},
      create: { nivelId: primaria.id, numero: n, nombre: `${n}° Primaria` },
    });
    for (const c of CURSOS_PRIMARIA) {
      await prisma.cursoPorGrado.upsert({
        where: {
          gradoId_cursoCatalogoId: {
            gradoId: grado.id,
            cursoCatalogoId: catalogMap.get(c.codigo)!,
          },
        },
        update: {},
        create: {
          gradoId: grado.id,
          cursoCatalogoId: catalogMap.get(c.codigo)!,
          horasSemanales: 3,
        },
      });
    }
    for (const sec of SECCIONES) {
      await prisma.seccion.upsert({
        where: { gradoId_nombre: { gradoId: grado.id, nombre: sec } },
        update: {},
        create: { gradoId: grado.id, nombre: sec },
      });
    }
  }

  for (let n = 1; n <= 5; n++) {
    const grado = await prisma.grado.upsert({
      where: { nivelId_numero: { nivelId: secundaria.id, numero: n } },
      update: {},
      create: { nivelId: secundaria.id, numero: n, nombre: `${n}° Secundaria` },
    });
    for (const c of CURSOS_SECUNDARIA) {
      const min = (c as { gradosMin?: number }).gradosMin ?? 1;
      const max = (c as { gradosMax?: number }).gradosMax ?? 5;
      if (n < min || n > max) continue;
      await prisma.cursoPorGrado.upsert({
        where: {
          gradoId_cursoCatalogoId: {
            gradoId: grado.id,
            cursoCatalogoId: catalogMap.get(c.codigo)!,
          },
        },
        update: {},
        create: {
          gradoId: grado.id,
          cursoCatalogoId: catalogMap.get(c.codigo)!,
          horasSemanales: 4,
        },
      });
    }
    for (const sec of SECCIONES) {
      await prisma.seccion.upsert({
        where: { gradoId_nombre: { gradoId: grado.id, nombre: sec } },
        update: {},
        create: { gradoId: grado.id, nombre: sec },
      });
    }
  }

  await prisma.systemConfig.upsert({
    where: { clave: "institucion_nombre" },
    update: {},
    create: {
      clave: "institucion_nombre",
      valor: JSON.stringify({
        nombre: "I.E.P. Huancayo",
        ciudad: "Huancayo",
        region: "Junín",
        pais: "Perú",
      }),
    },
  });

  console.log("OK: roles, permisos, niveles, grados (1°-6° prim / 1°-5° sec), secciones A-C, catálogo curricular.");
  console.log("Sin usuarios ni estudiantes. Ejecute: npm run db:bootstrap");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
