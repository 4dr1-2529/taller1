/**
 * Seed estructura I.E.P. Blenkir — Primaria (51 tablas)
 * 6 grados · 22 secciones · 16 cursos · RBAC · ML features
 * Ejecutar: npm run db:seed
 */
import { PrismaClient, type RolCodigo } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISOS = [
  { codigo: "admin.full", modulo: "admin", descripcion: "Acceso total" },
  { codigo: "estudiantes.read", modulo: "estudiantes", descripcion: "Ver estudiantes" },
  { codigo: "estudiantes.write", modulo: "estudiantes", descripcion: "Gestionar estudiantes" },
  { codigo: "notas.write", modulo: "academico", descripcion: "Registrar notas" },
  { codigo: "asistencia.write", modulo: "asistencia", descripcion: "Registrar asistencia" },
  { codigo: "alertas.manage", modulo: "alertas", descripcion: "Gestionar alertas" },
  { codigo: "ia.predict", modulo: "ia", descripcion: "Ejecutar predicciones" },
  { codigo: "reportes.export", modulo: "reportes", descripcion: "Exportar reportes" },
  { codigo: "mensajes.send", modulo: "mensajeria", descripcion: "Enviar mensajes" },
];

const ROLE_PERMS: Record<RolCodigo, string[]> = {
  admin: PERMISOS.filter(p => !["notas.write", "asistencia.write"].includes(p.codigo)).map((p) => p.codigo),
  docente: [
    "estudiantes.read",
    "notas.write",
    "asistencia.write",
    "alertas.manage",
    "ia.predict",
    "reportes.export",
    "mensajes.send",
  ],
  estudiante: ["estudiantes.read", "mensajes.send"],
};

const AREAS = [
  { codigo: "MAT", nombre: "Matemática" },
  { codigo: "COM", nombre: "Comunicación" },
  { codigo: "CIE", nombre: "Ciencia y Tecnología" },
  { codigo: "SOC", nombre: "Ciencias Sociales" },
  { codigo: "REL", nombre: "Religión" },
  { codigo: "IDI", nombre: "Idiomas" },
  { codigo: "TAL", nombre: "Arte y Taller" },
  { codigo: "EDF", nombre: "Educación Física" },
];

const CURSOS = [
  { codigo: "ARI", nombre: "Aritmética", area: "MAT" },
  { codigo: "ALG", nombre: "Álgebra", area: "MAT", desdeGrado: 3 },
  { codigo: "RZM", nombre: "Razonamiento Matemático", area: "MAT", desdeGrado: 3 },
  { codigo: "GEO", nombre: "Geometría", area: "MAT", desdeGrado: 3 },
  { codigo: "PDT", nombre: "Producción de Textos", area: "COM" },
  { codigo: "GRA", nombre: "Gramática", area: "COM" },
  { codigo: "RZV", nombre: "Razonamiento Verbal", area: "COM" },
  { codigo: "CUH", nombre: "Cuerpo Humano", area: "CIE" },
  { codigo: "MUF", nombre: "Mundo Físico", area: "CIE" },
  { codigo: "CIU", nombre: "Ciudadanía", area: "SOC" },
  { codigo: "GEG", nombre: "Geografía", area: "SOC" },
  { codigo: "HIS", nombre: "Historia", area: "SOC" },
  { codigo: "REL", nombre: "Religión", area: "REL" },
  { codigo: "ING", nombre: "Inglés", area: "IDI" },
  { codigo: "TAL", nombre: "Taller", area: "TAL" },
  { codigo: "EDF", nombre: "Educación Física", area: "EDF" },
];

const ML_FEATURES = [
  { codigo: "promedio_general", nombre: "Promedio general", tipoDato: "decimal", rangoMin: 0, rangoMax: 20, orden: 1 },
  { codigo: "cursos_desaprobados", nombre: "Cursos desaprobados", tipoDato: "integer", rangoMin: 0, rangoMax: 100, orden: 2 },
  { codigo: "asistencia_general", nombre: "Asistencia general", tipoDato: "decimal", rangoMin: 0, rangoMax: 100, orden: 3 },
  { codigo: "frecuencia_acceso_lms", nombre: "Accesos por semana", tipoDato: "decimal", rangoMin: 0, rangoMax: 10000, orden: 4 },
  { codigo: "tiempo_interaccion_lms", nombre: "Horas observadas en 28 días", tipoDato: "decimal", rangoMin: 0, rangoMax: 672, orden: 5 },
  { codigo: "actividades_realizadas", nombre: "Actividades completadas", tipoDato: "integer", rangoMin: 0, rangoMax: 10000, orden: 6 },
  { codigo: "recursos_consultados", nombre: "Materiales distintos", tipoDato: "integer", rangoMin: 0, rangoMax: 10000, orden: 7 },

];

function seccionesPorGrado(numero: number): string[] {
  return numero <= 4 ? ["A", "B", "C", "D"] : ["A", "B", "C"];
}

const CAPACIDAD_SALON = 30;

async function main() {
  console.log("Seed Blenkir v3 — estructura primaria (51 tablas)...");

  const institucion = await prisma.institucion.upsert({
    where: { codigo: "BLENKIR" },
    update: {},
    create: {
      codigo: "BLENKIR",
      nombre: "Institución Educativa Privada Blenkir",
    },
  });

  const anio = await prisma.anioLectivo.upsert({
    where: { institucionId_anio: { institucionId: institucion.id, anio: 2026 } },
    update: { fechaInicio: new Date("2026-03-01"), fechaFin: new Date("2026-12-15"), activo: true },
    create: {
      institucionId: institucion.id,
      anio: 2026,
      nombre: "Año Lectivo 2026",
      fechaInicio: new Date("2026-03-01"),
      fechaFin: new Date("2026-12-15"),
      activo: true,
    },
  });

  const periodos = [
    [1, "I Bimestre", "2026-03-02", "2026-05-08", false],
    [2, "II Bimestre", "2026-05-11", "2026-07-24", false],
    [3, "III Bimestre", "2026-08-03", "2026-10-09", true],
    [4, "IV Bimestre", "2026-10-12", "2026-12-15", false],
  ] as const;
  for (const [n, nombre, inicio, fin, activo] of periodos) {
    await prisma.periodoAcademico.upsert({
      where: { anioLectivoId_numero: { anioLectivoId: anio.id, numero: n } },
      update: { nombre, fechaInicio: new Date(inicio), fechaFin: new Date(fin), activo },
      create: {
        anioLectivoId: anio.id,
        numero: n,
        nombre,
        fechaInicio: new Date(inicio),
        fechaFin: new Date(fin),
        activo,
      },
    });
  }

  const nivel = await prisma.nivelEducativo.upsert({
    where: { codigo: "primaria" },
    update: {},
    create: { codigo: "primaria", nombre: "Educación Primaria" },
  });

  const areaMap = new Map<string, bigint>();
  for (const a of AREAS) {
    const row = await prisma.areaCurricular.upsert({
      where: { codigo: a.codigo },
      update: {},
      create: a,
    });
    areaMap.set(a.codigo, row.id);
  }

  const cursoMap = new Map<string, bigint>();
  for (const c of CURSOS) {
    const row = await prisma.cursoCatalogo.upsert({
      where: { codigo: c.codigo },
      update: { nombre: c.nombre },
      create: {
        codigo: c.codigo,
        nombre: c.nombre,
        areaId: areaMap.get(c.area)!,
        horasSemanales: 2,
      },
    });
    cursoMap.set(c.codigo, row.id);
  }

  for (let n = 1; n <= 6; n++) {
    const grado = await prisma.grado.upsert({
      where: { nivelId_numero: { nivelId: nivel.id, numero: n } },
      update: { nombre: `${n}° Primaria` },
      create: { nivelId: nivel.id, numero: n, nombre: `${n}° Primaria` },
    });

    for (const c of CURSOS) {
      const min = c.desdeGrado ?? 1;
      if (n < min) continue;
      await prisma.cursoGrado.upsert({
        where: { gradoId_cursoId: { gradoId: grado.id, cursoId: cursoMap.get(c.codigo)! } },
        update: {},
        create: { gradoId: grado.id, cursoId: cursoMap.get(c.codigo)!, obligatorio: true },
      });
    }

    for (const sec of seccionesPorGrado(n)) {
      await prisma.seccion.upsert({
        where: { gradoId_nombre: { gradoId: grado.id, nombre: sec } },
        update: { capacidad: CAPACIDAD_SALON },
        create: { gradoId: grado.id, nombre: sec, capacidad: CAPACIDAD_SALON },
      });
    }
  }

  for (const p of PERMISOS) {
    await prisma.permission.upsert({ where: { codigo: p.codigo }, update: {}, create: p });
  }

  for (const [codigo, perms] of Object.entries(ROLE_PERMS) as [RolCodigo, string[]][]) {
    const roleRow = await prisma.role.upsert({
      where: { codigo },
      update: {},
      create: {
        codigo,
        nombre: codigo === "admin" ? "Director" : codigo === "docente" ? "Profesor" : "Estudiante",
      },
    });
    for (const pc of perms) {
      const perm = await prisma.permission.findUnique({ where: { codigo: pc } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { rolId_permisoId: { rolId: roleRow.id, permisoId: perm.id } },
        update: {},
        create: { rolId: roleRow.id, permisoId: perm.id },
      });
    }
  }

  for (const f of ML_FEATURES) {
    await prisma.mlFeatureDef.upsert({
      where: { codigo: f.codigo },
      update: f,
      create: f,
    });
  }
  await prisma.mlFeatureDef.deleteMany({ where: { codigo: { notIn: ML_FEATURES.map(({ codigo }) => codigo) } } });

  await prisma.mensajeSala.upsert({
    where: { roomId: "global-institucion" },
    update: {},
    create: { roomId: "global-institucion", alcance: "global", titulo: "Comunicados I.E.P. Blenkir" },
  });

  await prisma.mensajeSala.upsert({
    where: { roomId: "profesores-interno" },
    update: {},
    create: { roomId: "profesores-interno", alcance: "profesores", titulo: "Coordinación docente" },
  });

  await prisma.systemConfig.upsert({
    where: { clave: "institucion.nombre" },
    update: { valor: "I.E.P. Blenkir" },
    create: { clave: "institucion.nombre", valor: "I.E.P. Blenkir" },
  });

  await prisma.systemConfig.upsert({
    where: { clave: "anio_lectivo_activo" },
    update: { valor: "2026" },
    create: { clave: "anio_lectivo_activo", valor: "2026" },
  });

  for (const [entidad, prefijo] of [
    ["estudiante", "EST-"], ["profesor", "PROF-"], ["matricula", "MAT-2026-"],
  ] as const) {
    await prisma.correlativo.upsert({
      where: { entidad }, update: { prefijo }, create: { entidad, prefijo, ultimoNumero: 0 },
    });
  }

  const secciones = await prisma.seccion.count();
  const cursos = await prisma.cursoCatalogo.count();
  console.log(`OK — institución Blenkir · ${secciones} secciones · ${cursos} cursos en catálogo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
