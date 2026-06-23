/**
 * Población demo Blenkir — 1 director, 8 tutores (1°-2°), 15 docentes polidocencia (3°-6°), 660 estudiantes
 * Cuentas: director@blenkir.edu.pe · pro{DNI}@ · nombre.apellido{DNI}@
 * Requiere: npm run db:seed
 * Ejecutar: npm run db:seed:demo
 */
import { PrismaClient, type NivelRiesgo } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedTeacherAssignments } from "./seed-assignments.js";
import { seedBimesterGrades } from "./demo-data/seed-grades.js";
import { TUTOR_SALON_LABELS } from "./demo-data/tutor-labels.js";
import {
  nextUniqueDni,
  randomPeruvianPerson,
  studentEmail,
  teacherEmail,
} from "./demo-data/peruvian-names.js";
import { DEFAULT_INSTITUTION_PASSWORD } from "../scripts/default-password.mjs";

const prisma = new PrismaClient();
const PASSWORD = DEFAULT_INSTITUTION_PASSWORD;
const ALUMNOS_POR_SALON = 30;
const DIRECTOR_EMAIL = "director@blenkir.edu.pe";

const POLI_SPECIALTIES = [
  "Inglés",
  "Comunicación",
  "Ciencias",
  "Ciencias Sociales",
  "Educación Física",
  "Matemática",
  "Lenguaje",
  "Religión",
  "Taller",
  "Geografía",
  "Historia",
  "Razonamiento",
  "Geometría",
  "Álgebra",
  "Arte",
] as const;

async function getRolId(codigo: "admin" | "docente" | "estudiante") {
  const rol = await prisma.role.findUnique({ where: { codigo } });
  if (!rol) throw new Error(`Rol ${codigo} no encontrado — ejecute db:seed`);
  return rol.id;
}

function seccionesConfig(): { gradoNum: number; nombre: string }[] {
  const out: { gradoNum: number; nombre: string }[] = [];
  for (let g = 1; g <= 4; g++) {
    for (const s of ["A", "B", "C", "D"]) out.push({ gradoNum: g, nombre: s });
  }
  for (let g = 5; g <= 6; g++) {
    for (const s of ["A", "B", "C"]) out.push({ gradoNum: g, nombre: s });
  }
  return out;
}

async function main() {
  const totalEsperado = seccionesConfig().length * ALUMNOS_POR_SALON;
  const totalProfesores = TUTOR_SALON_LABELS.length + POLI_SPECIALTIES.length;
  console.log(
    `Seed demo Blenkir — 1 director, ${totalProfesores} profesores (${TUTOR_SALON_LABELS.length} tutores 1°-2° + ${POLI_SPECIALTIES.length} polidocencia), ${totalEsperado} estudiantes (${ALUMNOS_POR_SALON}/salón)…`,
  );

  const hash = await bcrypt.hash(PASSWORD, 12);
  const rolAdmin = await getRolId("admin");
  const rolDocente = await getRolId("docente");
  const rolEstudiante = await getRolId("estudiante");

  const usedDni = new Set<string>();
  const usedEmails = new Set<string>([DIRECTOR_EMAIL]);

  const anio = await prisma.anioLectivo.findFirst({ where: { anio: 2026 } });
  if (!anio) throw new Error("Ejecute npm run db:seed primero");

  const periodos = await prisma.periodoAcademico.findMany({
    where: { anioLectivoId: anio.id, numero: { in: [1, 2] } },
    orderBy: { numero: "asc" },
  });
  if (periodos.length < 2) {
    throw new Error("Faltan bimestres I y II — ejecute npm run db:seed");
  }
  const periodo1 = periodos.find((p) => p.numero === 1)!;

  const directorPerson = randomPeruvianPerson();
  const directorDni = nextUniqueDni(usedDni);

  await prisma.user.upsert({
    where: { email: DIRECTOR_EMAIL },
    update: {
      passwordHash: hash,
      rolId: rolAdmin,
      nombres: directorPerson.nombres,
      apellidos: directorPerson.apellidos,
      dni: directorDni,
      activo: true,
    },
    create: {
      email: DIRECTOR_EMAIL,
      passwordHash: hash,
      nombres: directorPerson.nombres,
      apellidos: directorPerson.apellidos,
      dni: directorDni,
      rolId: rolAdmin,
    },
  });

  async function upsertTeacher(codigo: string, especialidad: string): Promise<bigint> {
    const person = randomPeruvianPerson();
    const dni = nextUniqueDni(usedDni);
    const email = teacherEmail(dni);
    usedEmails.add(email);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hash,
        rolId: rolDocente,
        nombres: person.nombres,
        apellidos: person.apellidos,
        dni,
        activo: true,
      },
      create: {
        email,
        passwordHash: hash,
        nombres: person.nombres,
        apellidos: person.apellidos,
        dni,
        rolId: rolDocente,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { codigo },
      update: {
        usuarioId: user.id,
        email,
        nombres: person.nombres,
        apellidos: person.apellidos,
        especialidad,
        activo: true,
      },
      create: {
        usuarioId: user.id,
        codigo,
        nombres: person.nombres,
        apellidos: person.apellidos,
        especialidad,
        email,
      },
    });
    return teacher.id;
  }

  const tutorTeacherIds: bigint[] = [];
  for (let i = 0; i < TUTOR_SALON_LABELS.length; i++) {
    const label = TUTOR_SALON_LABELS[i]!;
    const codigo = `DOC-${String(i + 1).padStart(3, "0")}`;
    tutorTeacherIds.push(await upsertTeacher(codigo, label.especialidad));
  }

  const poliTeacherIds: bigint[] = [];
  for (let i = 0; i < POLI_SPECIALTIES.length; i++) {
    const codigo = `DOC-${String(TUTOR_SALON_LABELS.length + i + 1).padStart(3, "0")}`;
    poliTeacherIds.push(await upsertTeacher(codigo, POLI_SPECIALTIES[i]!));
  }

  const teacherIds = [...tutorTeacherIds, ...poliTeacherIds];

  const secciones = await prisma.seccion.findMany({
    include: { grado: true },
    orderBy: [{ grado: { numero: "asc" } }, { nombre: "asc" }],
  });

  await seedTeacherAssignments(prisma, tutorTeacherIds, poliTeacherIds, secciones, anio.id);

  const modelo = await prisma.mlModelo.findFirst({ where: { esProduccion: true } });

  let studentNum = 0;
  const config = seccionesConfig();

  for (const cfg of config) {
    const sec = secciones.find((s) => s.grado.numero === cfg.gradoNum && s.nombre === cfg.nombre);
    if (!sec) continue;

    for (let i = 0; i < ALUMNOS_POR_SALON; i++) {
      studentNum++;
      const num = String(studentNum).padStart(4, "0");
      const codigo = `EST-2026-${num}`;
      const person = randomPeruvianPerson();
      const dni = nextUniqueDni(usedDni);
      const email = studentEmail(person.nombres, person.apellidos, dni, usedEmails);

      const promedio = 8 + ((studentNum * 7) % 110) / 10;
      const asistencia = 72 + ((studentNum * 3) % 28);
      const estado = studentNum % 17 === 0 ? "en_riesgo" : studentNum % 53 === 0 ? "retirado" : "activo";
      const nivel: NivelRiesgo =
        promedio < 11 || asistencia < 75 ? "alto" : promedio < 13 || asistencia < 85 ? "medio" : "bajo";

      const existing = await prisma.student.findUnique({ where: { codigo } });

      const user = await prisma.user.upsert({
        where: { email },
        update: {
          passwordHash: hash,
          rolId: rolEstudiante,
          nombres: person.nombres,
          apellidos: person.apellidos,
          dni,
          activo: true,
        },
        create: {
          email,
          passwordHash: hash,
          nombres: person.nombres,
          apellidos: person.apellidos,
          dni,
          rolId: rolEstudiante,
        },
      });

      if (existing?.usuarioId && existing.usuarioId !== user.id) {
        await prisma.user.update({
          where: { id: existing.usuarioId },
          data: { activo: false },
        });
      }

      const student = await prisma.student.upsert({
        where: { codigo },
        update: {
          usuarioId: user.id,
          nombres: person.nombres,
          apellidos: person.apellidos,
          dni,
          email,
          seccionId: sec.id,
          promedioGeneral: promedio,
          asistenciaGeneral: asistencia,
          estado,
        },
        create: {
          usuarioId: user.id,
          codigo,
          nombres: person.nombres,
          apellidos: person.apellidos,
          dni,
          email,
          seccionId: sec.id,
          promedioGeneral: promedio,
          asistenciaGeneral: asistencia,
          estado,
          fechaIngreso: new Date("2026-03-01"),
        },
      });

      await prisma.matricula.upsert({
        where: { estudianteId_anioLectivoId: { estudianteId: student.id, anioLectivoId: anio.id } },
        update: { seccionId: sec.id, estado: "activa" },
        create: {
          estudianteId: student.id,
          seccionId: sec.id,
          anioLectivoId: anio.id,
          codigo: `MAT-EST-2026-${num}`,
          fechaMatricula: new Date("2026-03-01"),
        },
      });

      await prisma.lmsIndicadorEstudiante.upsert({
        where: { studentId_periodoId: { studentId: student.id, periodoId: periodo1.id } },
        update: {
          frecuenciaAcceso: 40 + ((studentNum * 5) % 55),
          tiempoPlataforma: 2 + (studentNum % 8),
          tareasRatio: 0.45 + ((studentNum * 3) % 55) / 100,
          participacion: 40 + ((studentNum * 5) % 55),
          usoForos: 0.2 + ((studentNum * 2) % 80) / 100,
          disminucionActividad: studentNum % 11 === 0 ? 15 + (studentNum % 20) : studentNum % 7,
        },
        create: {
          studentId: student.id,
          periodoId: periodo1.id,
          frecuenciaAcceso: 40 + ((studentNum * 5) % 55),
          tiempoPlataforma: 2 + (studentNum % 8),
          tareasRatio: 0.45 + ((studentNum * 3) % 55) / 100,
          participacion: 40 + ((studentNum * 5) % 55),
          usoForos: 0.2 + ((studentNum * 2) % 80) / 100,
          disminucionActividad: studentNum % 11 === 0 ? 15 + (studentNum % 20) : studentNum % 7,
        },
      });

      const basePct = 25 + ((studentNum * 7) % 65);
      for (let w = 1; w <= 4; w++) {
        const weekPct = Math.min(100, Math.max(5, basePct + (w - 2) * 8 + (studentNum % 5)));
        await prisma.lmsActivity.upsert({
          where: {
            studentId_anioSemana: { studentId: student.id, anioSemana: `2026-W${10 + w}` },
          },
          update: {
            actividadPct: weekPct,
            minutos: Math.round(weekPct * 2.5),
            horasPlataforma: Math.round(weekPct * 0.08 * 10) / 10,
            conexiones: Math.max(1, Math.round(weekPct / 12)),
          },
          create: {
            studentId: student.id,
            anioSemana: `2026-W${10 + w}`,
            actividadPct: weekPct,
            minutos: Math.round(weekPct * 2.5),
            horasPlataforma: Math.round(weekPct * 0.08 * 10) / 10,
            conexiones: Math.max(1, Math.round(weekPct / 12)),
          },
        });
      }

      if (studentNum <= 120 || studentNum % 5 === 0) {
        await prisma.prediction.deleteMany({ where: { studentId: student.id } });
        const pred = await prisma.prediction.create({
          data: {
            studentId: student.id,
            modeloId: modelo?.id ?? null,
            score: nivel === "alto" ? 78 : nivel === "medio" ? 52 : 25,
            nivelRiesgo: nivel,
            probabilidad: nivel === "alto" ? 0.85 : nivel === "medio" ? 0.55 : 0.15,
            probabilidadAbandono: nivel === "alto" ? 0.85 : nivel === "medio" ? 0.55 : 0.15,
            periodoId: periodo1.id,
          },
        });

        if (nivel !== "bajo") {
          await prisma.alert.deleteMany({ where: { studentId: student.id } });
          await prisma.alert.create({
            data: {
              studentId: student.id,
              prediccionId: pred.id,
              titulo: `Riesgo ${nivel} — ${student.codigo}`,
              descripcion: `Alerta automática por perfil académico/LMS (${nivel}).`,
              nivelRiesgo: nivel,
              score: Number(pred.score),
              probabilidad: Number(pred.probabilidadAbandono),
              estado: "nueva",
              recomendacion: "Seguimiento académico y contacto con apoderado.",
            },
          });
        }
      }

      if (studentNum % 100 === 0) console.log(`  … ${studentNum}/${totalEsperado} estudiantes`);
    }
  }

  await seedBimesterGrades(
    prisma,
    anio.id,
    periodos.map((p) => p.id),
  );

  const sala = await prisma.mensajeSala.findUnique({ where: { roomId: "global-institucion" } });
  const director = await prisma.user.findUnique({ where: { email: DIRECTOR_EMAIL } });
  if (sala && director) {
    const exists = await prisma.chatMessage.findFirst({
      where: { salaId: sala.id, remitenteId: director.id },
    });
    if (!exists) {
      await prisma.chatMessage.create({
        data: {
          salaId: sala.id,
          remitenteId: director.id,
          contenido:
            "Bienvenidos al año lectivo 2026 — I.E.P. Blenkir. Revisen sus indicadores de riesgo en el dashboard.",
        },
      });
    }
  }

  const sampleTeacher = await prisma.teacher.findFirst({ where: { codigo: "DOC-001" } });
  if (sampleTeacher) {
    console.log(`  Ej. tutor 1° A: ${sampleTeacher.email} (${sampleTeacher.nombres} ${sampleTeacher.apellidos})`);
  }
  const samplePoli = await prisma.teacher.findFirst({ where: { codigo: "DOC-009" } });
  if (samplePoli) {
    console.log(`  Ej. polidocencia: ${samplePoli.email} (${samplePoli.nombres} ${samplePoli.apellidos})`);
  }

  const matCount = await prisma.matricula.count({ where: { estado: "activa" } });
  const gradeCount = await prisma.grade.count();
  const userStudents = await prisma.user.count({ where: { rolId: rolEstudiante, activo: true } });
  const userTeachers = await prisma.user.count({ where: { rolId: rolDocente, activo: true } });

  const seccionesCheck = await prisma.seccion.findMany({
    include: { grado: true, _count: { select: { estudiantes: true } } },
    orderBy: [{ grado: { numero: "asc" } }, { nombre: "asc" }],
  });
  const fueraDeLimite = seccionesCheck.filter((s) => s._count.estudiantes !== ALUMNOS_POR_SALON);
  for (const s of fueraDeLimite) {
    console.warn(
      `  ⚠ ${s.grado.numero}° ${s.nombre}: ${s._count.estudiantes} alumnos (esperado ${ALUMNOS_POR_SALON})`,
    );
  }

  const sampleStudent = await prisma.student.findFirst({
    where: { codigo: "EST-2026-0001" },
    select: { email: true, nombres: true, apellidos: true, dni: true },
  });

  console.log(
    `OK — ${studentNum} estudiantes · ${teacherIds.length} profesores (${TUTOR_SALON_LABELS.length} tutores + ${POLI_SPECIALTIES.length} polidocencia) · ${matCount} matrículas · ${gradeCount} notas (I–II bimestre)`,
  );
  console.log(`Cuentas — director: 1 · profesores: ${userTeachers} · estudiantes: ${userStudents}`);
  console.log(`Login director: ${DIRECTOR_EMAIL} / ${PASSWORD}`);
  if (sampleStudent?.email) {
    console.log(`Login estudiante ejemplo: ${sampleStudent.email} / ${PASSWORD}`);
  }
  if (sampleTeacher?.email) {
    console.log(`Login tutor ejemplo: ${sampleTeacher.email} / ${PASSWORD}`);
  }
  if (samplePoli?.email) {
    console.log(`Login polidocencia ejemplo: ${samplePoli.email} / ${PASSWORD}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
