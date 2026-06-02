/**
 * Población demo Blenkir — 1 director, 15 profesores, 660 estudiantes
 * Requiere: npm run db:seed
 * Ejecutar: npm run db:seed:demo
 */
import { PrismaClient, type NivelRiesgo } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Tesis2026!";

async function getRolId(codigo: "admin" | "docente" | "estudiante") {
  const rol = await prisma.role.findUnique({ where: { codigo } });
  if (!rol) throw new Error(`Rol ${codigo} no encontrado — ejecute db:seed`);
  return rol.id;
}

const NOMBRES = [
  "Mateo", "Valentina", "Santiago", "Luciana", "Sebastián", "Camila", "Diego", "Isabella",
  "Alejandro", "Sofía", "Daniel", "Mariana", "Andrés", "Emilia", "Gabriel", "Victoria",
];
const APELLIDOS = [
  "Quispe", "Flores", "García", "Torres", "Mamani", "Rojas", "Díaz", "Chávez", "Vega", "Castro",
];

const PROFESORES: { nombres: string; apellidos: string; esp: string }[] = [
  { nombres: "María", apellidos: "Quispe", esp: "Aritmética" },
  { nombres: "José", apellidos: "Flores", esp: "Comunicación" },
  { nombres: "Ana", apellidos: "García", esp: "Ciencias" },
  { nombres: "Luis", apellidos: "Torres", esp: "Ciencias Sociales" },
  { nombres: "Rosa", apellidos: "Mamani", esp: "Inglés" },
  { nombres: "Pedro", apellidos: "Rojas", esp: "Educación Física" },
  { nombres: "Lucía", apellidos: "Díaz", esp: "Matemática" },
  { nombres: "Jorge", apellidos: "Chávez", esp: "Lenguaje" },
  { nombres: "Carmen", apellidos: "Vega", esp: "Religión" },
  { nombres: "Miguel", apellidos: "Castro", esp: "Taller" },
  { nombres: "Patricia", apellidos: "Silva", esp: "Geografía" },
  { nombres: "Ricardo", apellidos: "Herrera", esp: "Historia" },
  { nombres: "Elena", apellidos: "Morales", esp: "Razonamiento" },
  { nombres: "Fernando", apellidos: "Paredes", esp: "Geometría" },
  { nombres: "Gabriela", apellidos: "Salazar", esp: "Álgebra" },
];

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
  console.log("Seed demo Blenkir — director, 15 profesores, 660 estudiantes...");
  const hash = await bcrypt.hash(PASSWORD, 12);
  const rolAdmin = await getRolId("admin");
  const rolDocente = await getRolId("docente");
  const rolEstudiante = await getRolId("estudiante");

  const anio = await prisma.anioLectivo.findFirst({ where: { anio: 2026 } });
  if (!anio) throw new Error("Ejecute npm run db:seed primero");
  const periodo = await prisma.periodoAcademico.findFirst({
    where: { anioLectivoId: anio.id, numero: 1 },
  });
  if (!periodo) throw new Error("Periodo académico no encontrado");

  await prisma.user.upsert({
    where: { email: "director@blenkir.edu.pe" },
    update: { passwordHash: hash, rolId: rolAdmin },
    create: {
      email: "director@blenkir.edu.pe",
      passwordHash: hash,
      nombres: "Carlos",
      apellidos: "Ramírez Vargas",
      dni: "12345678",
      rolId: rolAdmin,
    },
  });

  const teacherIds: bigint[] = [];
  for (let i = 0; i < PROFESORES.length; i++) {
    const p = PROFESORES[i];
    const email = `profesor${i + 1}@blenkir.edu.pe`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash: hash, rolId: rolDocente },
      create: {
        email,
        passwordHash: hash,
        nombres: p.nombres,
        apellidos: p.apellidos,
        rolId: rolDocente,
      },
    });
    const teacher = await prisma.teacher.upsert({
      where: { codigo: `DOC-${String(i + 1).padStart(3, "0")}` },
      update: { usuarioId: user.id, email },
      create: {
        usuarioId: user.id,
        codigo: `DOC-${String(i + 1).padStart(3, "0")}`,
        nombres: p.nombres,
        apellidos: p.apellidos,
        especialidad: p.esp,
        email,
      },
    });
    teacherIds.push(teacher.id);
  }

  const secciones = await prisma.seccion.findMany({
    include: { grado: true },
    orderBy: [{ grado: { numero: "asc" } }, { nombre: "asc" }],
  });

  let tutorIdx = 0;
  for (const sec of secciones) {
    await prisma.tutorSeccion.upsert({
      where: { seccionId_anioLectivoId: { seccionId: sec.id, anioLectivoId: anio.id } },
      update: {},
      create: {
        seccionId: sec.id,
        profesorId: teacherIds[tutorIdx % teacherIds.length]!,
        anioLectivoId: anio.id,
      },
    });
    tutorIdx++;

    const cursosGrado = await prisma.cursoGrado.findMany({
      where: { gradoId: sec.gradoId },
      include: { curso: true },
    });

    for (let ci = 0; ci < cursosGrado.length; ci++) {
      const cg = cursosGrado[ci]!;
      const codigo = `${cg.curso.codigo}-${sec.grado.numero}${sec.nombre}-2026`;
      await prisma.course.upsert({
        where: { codigo },
        update: {},
        create: {
          cursoId: cg.cursoId,
          seccionId: sec.id,
          profesorId: teacherIds[(ci + Number(sec.id)) % teacherIds.length]!,
          anioLectivoId: anio.id,
          codigo,
        },
      });
    }
  }

  const modelo = await prisma.mlModelo.findFirst({ where: { esProduccion: true } });

  let studentNum = 0;
  const config = seccionesConfig();
  for (const cfg of config) {
    const sec = secciones.find((s) => s.grado.numero === cfg.gradoNum && s.nombre === cfg.nombre);
    if (!sec) continue;

    const ofertas = await prisma.course.findMany({
      where: { seccionId: sec.id, anioLectivoId: anio.id },
    });

    for (let i = 0; i < 30; i++) {
      studentNum++;
      const num = String(studentNum).padStart(4, "0");
      const email = `estudiante${num}@blenkir.edu.pe`;
      const nom = NOMBRES[i % NOMBRES.length]!;
      const ape = `${APELLIDOS[(studentNum + i) % APELLIDOS.length]!} ${APELLIDOS[(studentNum * 2) % APELLIDOS.length]!}`;
      const promedio = 8 + ((studentNum * 7) % 110) / 10;
      const asistencia = 72 + ((studentNum * 3) % 28);
      const estado = studentNum % 17 === 0 ? "en_riesgo" : studentNum % 53 === 0 ? "retirado" : "activo";
      const nivel: NivelRiesgo =
        promedio < 11 || asistencia < 75 ? "alto" : promedio < 13 || asistencia < 85 ? "medio" : "bajo";

      const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash: hash, rolId: rolEstudiante },
        create: {
          email,
          passwordHash: hash,
          nombres: nom,
          apellidos: ape,
          dni: String(70000000 + studentNum).padStart(8, "0"),
          rolId: rolEstudiante,
        },
      });

      const student = await prisma.student.upsert({
        where: { codigo: `EST-2026-${num}` },
        update: {
          seccionId: sec.id,
          promedioGeneral: promedio,
          asistenciaGeneral: asistencia,
          estado,
        },
        create: {
          usuarioId: user.id,
          codigo: `EST-2026-${num}`,
          nombres: nom,
          apellidos: ape,
          dni: String(70000000 + studentNum).padStart(8, "0"),
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
        update: {},
        create: {
          estudianteId: student.id,
          seccionId: sec.id,
          anioLectivoId: anio.id,
          codigo: `MAT-EST-2026-${num}`,
          fechaMatricula: new Date("2026-03-01"),
        },
      });

      for (const oferta of ofertas) {
        await prisma.enrollment.upsert({
          where: { studentId_cursoOfertaId: { studentId: student.id, cursoOfertaId: oferta.id } },
          update: {},
          create: { studentId: student.id, cursoOfertaId: oferta.id },
        });
      }

      await prisma.lmsIndicadorEstudiante.upsert({
        where: { studentId_periodoId: { studentId: student.id, periodoId: periodo.id } },
        update: {},
        create: {
          studentId: student.id,
          periodoId: periodo.id,
          frecuenciaAcceso: 40 + ((studentNum * 5) % 55),
          tiempoPlataforma: 2 + (studentNum % 8),
          tareasRatio: 0.45 + ((studentNum * 3) % 55) / 100,
          participacion: 40 + ((studentNum * 5) % 55),
          usoForos: 0.2 + ((studentNum * 2) % 80) / 100,
          disminucionActividad: studentNum % 11 === 0 ? 15 + (studentNum % 20) : studentNum % 7,
        },
      });

      if (studentNum <= 120 || studentNum % 5 === 0) {
        const pred = await prisma.prediction.create({
          data: {
            studentId: student.id,
            modeloId: modelo?.id ?? null,
            score: nivel === "alto" ? 78 : nivel === "medio" ? 52 : 25,
            nivelRiesgo: nivel,
            probabilidad: nivel === "alto" ? 0.85 : nivel === "medio" ? 0.55 : 0.15,
            probabilidadAbandono: nivel === "alto" ? 0.85 : nivel === "medio" ? 0.55 : 0.15,
            periodoId: periodo.id,
          },
        });

        if (nivel !== "bajo") {
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

      if (studentNum % 100 === 0) console.log(`  … ${studentNum}/660 estudiantes`);
    }
  }

  const sala = await prisma.mensajeSala.findUnique({ where: { roomId: "global-institucion" } });
  const director = await prisma.user.findUnique({ where: { email: "director@blenkir.edu.pe" } });
  if (sala && director) {
    const exists = await prisma.chatMessage.findFirst({
      where: { salaId: sala.id, remitenteId: director.id },
    });
    if (!exists) {
      await prisma.chatMessage.create({
        data: {
          salaId: sala.id,
          remitenteId: director.id,
          contenido: "Bienvenidos al año lectivo 2026 — I.E.P. Blenkir. Revisen sus indicadores de riesgo en el dashboard.",
        },
      });
    }
  }

  console.log(`OK — ${studentNum} estudiantes · ${teacherIds.length} profesores · director@blenkir.edu.pe / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
