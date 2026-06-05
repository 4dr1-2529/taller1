import type { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { idToString } from "../utils/ids.js";
import { courseDisplayName, courseListInclude } from "../utils/course-label.js";
import { notaEstadoLabel } from "../utils/grade-status.js";
import { getActiveAnioLectivoId } from "../utils/academic-period.js";
import { deriveLmsEngagement } from "../utils/lms-engagement.js";

const LEVEL_LABEL: Record<string, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

const ALERT_STATUS_LABEL: Record<string, string> = {
  nueva: "Nueva",
  en_seguimiento: "En seguimiento",
  resuelta: "Resuelta",
};

const studentProfileInclude = {
  seccion: { include: { grado: { include: { nivel: true } } } },
} satisfies Prisma.StudentInclude;

function salonLabel(seccion: { nombre: string; grado: { numero: number } } | null | undefined): string | null {
  if (!seccion) return null;
  return `${seccion.grado.numero}°${seccion.nombre}`;
}

function attendanceEstado(row: { presente: boolean; tardanza: boolean; justificado: boolean }): string {
  if (row.justificado) return "Justificada";
  if (row.tardanza) return "Tardanza";
  if (row.presente) return "Asistió";
  return "Falta";
}

export async function loadStudentProfile(studentId: bigint) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: studentProfileInclude,
  });
  if (!student) return null;
  return {
    id: idToString(student.id),
    codigo: student.codigo,
    nombres: student.nombres,
    apellidos: student.apellidos,
    email: student.email,
    telefono: student.telefono,
    grado: student.seccion?.grado.numero ?? null,
    gradoLabel: student.seccion?.grado.numero ? `${student.seccion.grado.numero}°` : null,
    seccion: student.seccion?.nombre ?? null,
    salon: salonLabel(student.seccion),
    periodoAcademico: await activePeriodoLabel(),
    promedioGeneral: Number(student.promedioGeneral),
    asistenciaGeneral: Number(student.asistenciaGeneral),
  };
}

async function activePeriodoLabel(): Promise<string | null> {
  const p = await prisma.periodoAcademico.findFirst({
    where: { activo: true },
    orderBy: { numero: "desc" },
    select: { nombre: true },
  });
  return p?.nombre ?? null;
}

export async function buildEstudianteDashboard(studentId: bigint) {
  const [profile, latestGrade, latestAttendance, latestPrediction, alerts, lmsActs, recommendation] =
    await Promise.all([
      loadStudentProfile(studentId),
      prisma.grade.findFirst({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        include: {
          cursoOferta: { include: courseListInclude },
          periodo: { select: { numero: true, nombre: true } },
        },
      }),
      prisma.attendance.findFirst({
        where: { studentId },
        orderBy: { fecha: "desc" },
      }),
      prisma.prediction.findFirst({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        include: { factores: true, modelo: { select: { nombre: true, version: true } } },
      }),
      prisma.alert.findMany({
        where: { studentId, estado: { in: ["nueva", "en_seguimiento"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.lmsActivity.findMany({
        where: { studentId },
        orderBy: { anioSemana: "desc" },
        take: 1,
      }),
      prisma.aiRecommendation.findFirst({
        where: { studentId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const openAlerts = alerts.length;
  const pred = latestPrediction;

  return {
    profile,
    kpis: {
      grado: profile?.gradoLabel ?? "—",
      salon: profile?.salon ?? "—",
      promedioGeneral: profile?.promedioGeneral ?? 0,
      asistenciaGeneral: profile?.asistenciaGeneral ?? 0,
      nivelRiesgo: pred ? LEVEL_LABEL[pred.nivelRiesgo] ?? pred.nivelRiesgo : "Sin datos",
      alertasActivas: openAlerts,
    },
    resumen: {
      ultimaNota: latestGrade
        ? {
            curso: latestGrade.cursoOferta ? courseDisplayName(latestGrade.cursoOferta) : "—",
            nota: Number(latestGrade.nota),
            bimestre: latestGrade.periodo.numero,
            fecha: latestGrade.createdAt,
          }
        : null,
      ultimaAsistencia: latestAttendance
        ? {
            fecha: latestAttendance.fecha,
            estado: attendanceEstado(latestAttendance),
          }
        : null,
      ultimaActividadLms: lmsActs[0]
        ? {
            semana: lmsActs[0].anioSemana,
            actividadPct: Number(lmsActs[0].actividadPct),
            minutos: lmsActs[0].minutos,
          }
        : null,
      ultimaPrediccion: pred
        ? {
            score: Number(pred.score),
            nivel: LEVEL_LABEL[pred.nivelRiesgo] ?? pred.nivelRiesgo,
            fecha: pred.createdAt,
          }
        : null,
      recomendacion:
        recommendation?.detalle ??
        alerts[0]?.recomendacion ??
        (pred ? "Revise sus indicadores académicos y mantenga participación en la plataforma." : null),
    },
    alertasPreview: alerts.map((a) => ({
      id: idToString(a.id),
      nivel: LEVEL_LABEL[a.nivelRiesgo] ?? a.nivelRiesgo,
      titulo: a.titulo,
      recomendacion: a.recomendacion,
      estado: ALERT_STATUS_LABEL[a.estado] ?? a.estado,
      fecha: a.createdAt,
    })),
  };
}

export async function buildEstudianteNotas(studentId: bigint) {
  const profile = await loadStudentProfile(studentId);
  const anioId = await getActiveAnioLectivoId();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { seccionId: true },
  });

  const [courses, grades] = await Promise.all([
    student?.seccionId
      ? prisma.course.findMany({
          where: { seccionId: student.seccionId, anioLectivoId: anioId, activo: true },
          include: courseListInclude,
          orderBy: { codigo: "asc" },
        })
      : Promise.resolve([]),
    prisma.grade.findMany({
      where: { studentId },
      include: {
        cursoOferta: { include: courseListInclude },
        periodo: { select: { numero: true, nombre: true } },
      },
    }),
  ]);

  const gradeByCoursePeriod = new Map<string, Map<number, number>>();
  for (const g of grades) {
    const cid = idToString(g.cursoOfertaId);
    if (!gradeByCoursePeriod.has(cid)) gradeByCoursePeriod.set(cid, new Map());
    gradeByCoursePeriod.get(cid)!.set(g.periodo.numero, Number(g.nota));
  }

  let aprobados = 0;
  let riesgo = 0;
  let desaprobados = 0;

  const filas = courses.map((c) => {
    const cid = idToString(c.id);
    const bMap = gradeByCoursePeriod.get(cid) ?? new Map<number, number>();
    const b1 = bMap.get(1) ?? null;
    const b2 = bMap.get(2) ?? null;
    const b3 = bMap.get(3) ?? null;
    const b4 = bMap.get(4) ?? null;
    const nums = [b1, b2, b3, b4].filter((n): n is number => n != null);
    const promedio = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    const estado = promedio != null ? notaEstadoLabel(promedio) : "—";
    if (estado === "Aprobado") aprobados++;
    else if (estado === "En riesgo") riesgo++;
    else if (estado === "Desaprobado") desaprobados++;

    return {
      courseId: cid,
      curso: courseDisplayName(c),
      profesor: c.profesor ? `${c.profesor.nombres} ${c.profesor.apellidos}` : null,
      bimestre1: b1,
      bimestre2: b2,
      bimestre3: b3,
      bimestre4: b4,
      promedioFinal: promedio != null ? Math.round(promedio * 10) / 10 : null,
      estado,
    };
  });

  return {
    profile,
    filas,
    resumen: {
      promedioGeneral: profile?.promedioGeneral ?? 0,
      cursosAprobados: aprobados,
      cursosEnRiesgo: riesgo,
      cursosDesaprobados: desaprobados,
      totalCursos: filas.length,
    },
  };
}

type AsistenciaQuery = {
  mes?: string;
  bimestre?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
};

export async function buildEstudianteAsistencia(studentId: bigint, query: AsistenciaQuery) {
  const profile = await loadStudentProfile(studentId);
  const where: Prisma.AttendanceWhereInput = { studentId };

  if (query.desde) where.fecha = { ...(where.fecha as object), gte: new Date(query.desde) };
  if (query.hasta) {
    where.fecha = { ...(where.fecha as object), lte: new Date(query.hasta) };
  }
  if (query.mes && /^\d{4}-\d{2}$/.test(query.mes)) {
    const [y, m] = query.mes.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    where.fecha = { gte: start, lte: end };
  }
  if (query.bimestre && /^[1-4]$/.test(query.bimestre)) {
    const periodo = await prisma.periodoAcademico.findFirst({
      where: { numero: Number(query.bimestre), activo: true },
      orderBy: { numero: "desc" },
    });
    if (periodo) {
      where.fecha = { gte: periodo.fechaInicio, lte: periodo.fechaFin };
    }
  }

  const rows = await prisma.attendance.findMany({
    where,
    orderBy: { fecha: "desc" },
    take: 400,
  });

  let tutorName: string | null = null;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { seccionId: true },
  });
  if (student?.seccionId) {
    const anioId = await getActiveAnioLectivoId().catch(() => null);
    if (anioId) {
      const tutor = await prisma.tutorSeccion.findFirst({
        where: { seccionId: student.seccionId, anioLectivoId: anioId, activo: true },
        include: { profesor: { select: { nombres: true, apellidos: true } } },
      });
      if (tutor?.profesor) tutorName = `${tutor.profesor.nombres} ${tutor.profesor.apellidos}`;
    }
  }

  const items = rows
    .map((r) => {
      const estado = attendanceEstado(r);
      return {
        id: idToString(r.id),
        fecha: r.fecha,
        curso: null as string | null,
        estado,
        observacion: r.observacion,
        profesor: tutorName,
      };
    })
    .filter((r) => {
      if (!query.estado) return true;
      const q = query.estado.toLowerCase();
      if (q === "presente" || q === "asistio") return r.estado === "Asistió";
      if (q === "tardanza") return r.estado === "Tardanza";
      if (q === "falta") return r.estado === "Falta";
      if (q === "justificada") return r.estado === "Justificada";
      return r.estado.toLowerCase().includes(q);
    });

  let asistencias = 0;
  let tardanzas = 0;
  let faltas = 0;
  let justificadas = 0;
  for (const r of items) {
    if (r.estado === "Asistió") asistencias++;
    else if (r.estado === "Tardanza") tardanzas++;
    else if (r.estado === "Falta") faltas++;
    else if (r.estado === "Justificada") justificadas++;
  }
  const total = items.length;
  const porcentaje =
    total > 0 ? Math.round(((asistencias + tardanzas) / total) * 1000) / 10 : profile?.asistenciaGeneral ?? 0;

  return {
    profile,
    items,
    resumen: { asistencias, tardanzas, faltas, justificadas, porcentaje, total },
  };
}

export async function buildEstudianteLms(studentId: bigint) {
  const profile = await loadStudentProfile(studentId);
  const [acts, ind] = await Promise.all([
    prisma.lmsActivity.findMany({
      where: { studentId },
      orderBy: { anioSemana: "asc" },
    }),
    prisma.lmsIndicadorEstudiante.findFirst({
      where: { studentId },
      orderBy: { id: "desc" },
    }),
  ]);

  const compromiso = deriveLmsEngagement(acts, ind);
  const tareasRatio = ind ? Number(ind.tareasRatio) : 0;
  const tareasEntregadasPct = Math.round(tareasRatio * 100);
  const tareasPendientesPct = Math.max(0, 100 - tareasEntregadasPct);

  const semanas = acts.map((a) => ({
    semana: a.anioSemana,
    accesos: a.conexiones,
    minutos: a.minutos,
    tareasEntregadas: Math.round(Number(a.actividadPct)),
    participacion: ind ? Number(ind.participacion) : Number(a.actividadPct),
    compromiso: deriveLmsEngagement([a], ind),
  }));

  return {
    profile,
    tarjetas: {
      compromiso,
      tiempoPlataforma: ind ? Number(ind.tiempoPlataforma) : acts.reduce((s, a) => s + Number(a.horasPlataforma), 0),
      accesosLms: ind ? Number(ind.frecuenciaAcceso) : acts.reduce((s, a) => s + a.conexiones, 0),
      tareasEntregadas: tareasEntregadasPct,
      tareasPendientes: tareasPendientesPct,
      participacion: ind ? Number(ind.participacion) : 0,
    },
    semanas,
    chartSemanal: acts.map((a) => ({
      semana: a.anioSemana,
      actividad: Number(a.actividadPct),
      minutos: a.minutos,
      horas: Number(a.horasPlataforma),
    })),
    chartTareas: [
      { tipo: "Entregadas", valor: tareasEntregadasPct },
      { tipo: "Pendientes", valor: tareasPendientesPct },
    ],
  };
}

export async function buildEstudiantePrediccion(studentId: bigint) {
  const profile = await loadStudentProfile(studentId);
  const pred = await prisma.prediction.findFirst({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      factores: true,
      modelo: { select: { nombre: true, version: true, codigo: true } },
      recomendaciones: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!pred) {
    return { profile, prediction: null };
  }

  return {
    profile,
    prediction: {
      id: idToString(pred.id),
      score: Number(pred.score),
      probabilidad: Number(pred.probabilidad),
      probabilidadAbandono: Number(pred.probabilidadAbandono),
      nivelRiesgo: LEVEL_LABEL[pred.nivelRiesgo] ?? pred.nivelRiesgo,
      nivel: pred.nivelRiesgo,
      modelo: pred.modelo?.nombre ?? "Modelo ensemble local",
      modeloVersion: pred.modelo?.version ?? null,
      fecha: pred.createdAt,
      factores: pred.factores.map((f) => ({
        key: f.factorKey,
        label: f.etiqueta,
        contribution: Number(f.contribucion),
      })),
      recomendacion:
        pred.recomendaciones[0]?.detalle ??
        "Mantenga seguimiento de sus indicadores académicos y participación LMS.",
    },
  };
}

export async function buildEstudianteAlertas(studentId: bigint) {
  const items = await prisma.alert.findMany({
    where: { studentId, estado: { in: ["nueva", "en_seguimiento"] } },
    orderBy: [{ nivelRiesgo: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return {
    items: items.map((a) => ({
      id: idToString(a.id),
      titulo: a.titulo,
      nivelRiesgo: LEVEL_LABEL[a.nivelRiesgo] ?? a.nivelRiesgo,
      recomendacion: a.recomendacion,
      estado: ALERT_STATUS_LABEL[a.estado] ?? a.estado,
      score: a.score != null ? Number(a.score) : null,
      probabilidad: a.probabilidad != null ? Number(a.probabilidad) : null,
      fecha: a.createdAt,
    })),
    total: items.length,
  };
}

async function accessibleRoomIdsForStudent(userId: bigint): Promise<bigint[]> {
  const userSub = idToString(userId);
  const student = await prisma.student.findFirst({
    where: { usuarioId: userId, activo: true },
    select: { id: true, seccionId: true },
  });

  const roomKeys = new Set<string>(["global:institucional"]);
  if (student) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      select: { cursoOfertaId: true },
    });
    for (const e of enrollments) {
      roomKeys.add(`curso:${idToString(e.cursoOfertaId)}`);
    }
    if (student.seccionId) {
      const anioId = await getActiveAnioLectivoId().catch(() => null);
      if (anioId) {
        const courses = await prisma.course.findMany({
          where: { seccionId: student.seccionId, anioLectivoId: anioId, activo: true },
          select: { id: true },
        });
        for (const c of courses) {
          roomKeys.add(`curso:${idToString(c.id)}`);
        }
      }
    }
  }

  const salas = await prisma.mensajeSala.findMany({
    where: {
      OR: [{ roomId: { in: [...roomKeys] } }, { roomId: { startsWith: "direct:" } }],
    },
    select: { id: true, roomId: true },
  });

  return salas
    .filter((s) => {
      if (s.roomId.startsWith("direct:")) {
        const parts = s.roomId.split(":");
        return parts.length === 3 && (parts[1] === userSub || parts[2] === userSub);
      }
      return roomKeys.has(s.roomId);
    })
    .map((s) => s.id);
}

export async function buildEstudianteMensajes(userId: bigint) {
  const salaIds = await accessibleRoomIdsForStudent(userId);
  if (!salaIds.length) {
    return { items: [], total: 0 };
  }

  const mensajes = await prisma.chatMessage.findMany({
    where: {
      salaId: { in: salaIds },
      remitenteId: { not: userId },
      OR: [{ destinatarioId: userId }, { destinatarioId: null }],
    },
    include: {
      remitente: { select: { nombres: true, apellidos: true, email: true } },
      sala: {
        include: {
          cursoOferta: { include: courseListInclude },
        },
      },
      lecturas: { where: { usuarioId: userId }, select: { leido: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return {
    items: mensajes.map((m) => ({
      id: idToString(m.id),
      remitente: `${m.remitente.nombres} ${m.remitente.apellidos}`,
      remitenteEmail: m.remitente.email,
      curso: m.sala.cursoOferta ? courseDisplayName(m.sala.cursoOferta) : null,
      mensaje: m.contenido,
      fecha: m.createdAt,
      leido: m.lecturas[0]?.leido ?? false,
    })),
    total: mensajes.length,
  };
}
