import { prisma } from "../utils/prisma.js";
import type { Prisma } from "@prisma/client";
import { getMlMetrics } from "./ml-client.js";
import { idToString } from "../utils/ids.js";

type Scope = Prisma.StudentWhereInput;

export async function buildDashboardAnalytics(scope: Scope) {
  const [
    totalStudents,
    totalTeachers,
    totalSalones,
    openAlerts,
    alertsByLevel,
    recentPredictions,
    avgRisk,
    studentsWithSection,
    seccionesActivas,
    lmsIndicadores,
    gradeCourseMeans,
    attendanceRows,
  ] = await Promise.all([
    prisma.student.count({ where: scope }),
    prisma.teacher.count({ where: { activo: true } }),
    prisma.seccion.count({ where: { activo: true } }),
    prisma.alert.count({
      where: { estado: { in: ["nueva", "en_seguimiento"] }, student: scope },
    }),
    prisma.alert.groupBy({
      by: ["nivelRiesgo"],
      where: { estado: { in: ["nueva", "en_seguimiento"] }, student: scope },
      _count: true,
    }),
    prisma.prediction.findMany({
      where: { student: scope },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        score: true,
        nivelRiesgo: true,
        createdAt: true,
        studentId: true,
        student: {
          select: {
            seccionId: true,
            seccion: {
              select: {
                nombre: true,
                grado: { select: { nombre: true, numero: true, nivel: { select: { nombre: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.prediction.aggregate({ where: { student: scope }, _avg: { score: true } }),
    prisma.student.findMany({
      where: scope,
      select: {
        id: true,
        codigo: true,
        nombres: true,
        apellidos: true,
        seccionId: true,
        seccion: {
          select: {
            nombre: true,
            grado: { select: { numero: true, nombre: true, nivel: { select: { nombre: true } } } },
          },
        },
        predicciones: { orderBy: { createdAt: "desc" }, take: 1, select: { nivelRiesgo: true, score: true, probabilidadAbandono: true } },
      },
    }),
    prisma.seccion.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        grado: { select: { numero: true, nombre: true, nivel: { select: { nombre: true } } } },
        _count: { select: { estudiantes: true } },
      },
    }),
    prisma.student.findMany({
      where: scope,
      select: {
        resourceEvents: { where: { createdAt: { gte: new Date(Date.now() - 28 * 86400000) } }, select: { createdAt: true } },
        seccion: { select: { grado: { select: { numero: true } } } },
      },
    }),
    prisma.grade.groupBy({
      by: ["studentId", "cursoOfertaId"],
      where: { student: scope, periodo: { anioLectivo: { anio: 2026 } } },
      _avg: { nota: true },
    }),
    prisma.attendance.findMany({
      where: { student: scope, fecha: { gte: new Date("2026-01-01"), lt: new Date("2027-01-01") } },
      select: { studentId: true, presente: true, tardanza: true, justificado: true },
    }),
  ]);

  // Promedio institucional honesto: media de medias por curso, solo con calificaciones
  // reales 2026 (un 0 real cuenta; sin registros no promedia). Misma fórmula que
  // refreshAcademicSummary a nivel alumno.
  const gradeSumByStudent = new Map<string, { sum: number; n: number }>();
  for (const g of gradeCourseMeans) {
    const k = String(g.studentId);
    const e = gradeSumByStudent.get(k) ?? { sum: 0, n: 0 };
    e.sum += Number(g._avg.nota);
    e.n++;
    gradeSumByStudent.set(k, e);
  }
  const studentGradeAvgs = [...gradeSumByStudent.values()].map((e) => e.sum / e.n);
  const avgGradeValue = studentGradeAvgs.length
    ? Math.round((studentGradeAvgs.reduce((a, b) => a + b, 0) / studentGradeAvgs.length) * 10) / 10
    : null;

  // Asistencia institucional honesta: solo registros computables 2026
  // (justificado=true excluido, igual que studentIndicators). Solo-justificados = sin datos.
  const attByStudent = new Map<string, { ok: number; computable: number }>();
  for (const a of attendanceRows) {
    if (a.justificado) continue;
    const k = String(a.studentId);
    const e = attByStudent.get(k) ?? { ok: 0, computable: 0 };
    e.computable++;
    if (a.presente || a.tardanza) e.ok++;
    attByStudent.set(k, e);
  }
  const studentAttPct = new Map<string, number>();
  for (const [k, e] of attByStudent) {
    if (e.computable > 0) studentAttPct.set(k, (100 * e.ok) / e.computable);
  }
  const attValues = [...studentAttPct.values()];
  const avgAttendanceValue = attValues.length
    ? Math.round((attValues.reduce((a, b) => a + b, 0) / attValues.length) * 10) / 10
    : null;

  const byLevel = { bajo: 0, medio: 0, alto: 0 };
  for (const st of studentsWithSection) {
    const lvl = st.predicciones[0]?.nivelRiesgo;
    if (lvl) byLevel[lvl]++;
  }

  const riskBySectionMap = new Map<string, { label: string; alto: number; medio: number; bajo: number; total: number }>();

  for (const st of studentsWithSection) {
    const label = st.seccion
      ? `${st.seccion.grado?.nivel?.nombre ?? ""} ${st.seccion.grado?.nombre ?? ""} ${st.seccion.nombre}`.trim()
      : "Sin sección";
    const row = riskBySectionMap.get(label) ?? { label, alto: 0, medio: 0, bajo: 0, total: 0 };
    row.total++;
    const lvl = st.predicciones[0]?.nivelRiesgo;
    if (lvl === "alto") row.alto++;
    else if (lvl === "medio") row.medio++;
    else if (lvl === "bajo") row.bajo++;
    riskBySectionMap.set(label, row);
  }

  const riskBySection = [...riskBySectionMap.values()].sort((a, b) => b.alto - a.alto);

  const openAlertsRows = await prisma.alert.findMany({
    where: { estado: { in: ["nueva", "en_seguimiento"] }, student: scope },
    select: {
      student: {
        select: {
          seccion: {
            select: {
              nombre: true,
              grado: { select: { numero: true } },
            },
          },
        },
      },
    },
  });
  const salonAlertMap = new Map<string, number>();
  for (const a of openAlertsRows) {
    const g = a.student.seccion?.grado?.numero;
    const sec = a.student.seccion?.nombre ?? "";
    if (!g || !sec) continue;
    const key = `${g}°${sec}`;
    salonAlertMap.set(key, (salonAlertMap.get(key) ?? 0) + 1);
  }
  const alertsBySalonShort = [...salonAlertMap.entries()]
    .map(([salon, count]) => ({ salon, count }))
    .sort((a, b) => a.salon.localeCompare(b.salon, "es"));

  const riskByGradoMap = new Map<number, { grado: string; alto: number; medio: number; bajo: number }>();
  for (const st of studentsWithSection) {
    const gradoNum = st.seccion?.grado?.numero
      ?? Number(st.seccion?.grado?.nombre?.match(/(\d+)/)?.[1] || 0);
    if (!gradoNum) continue;
    const row = riskByGradoMap.get(gradoNum) ?? {
      grado: `${gradoNum}°`,
      alto: 0,
      medio: 0,
      bajo: 0,
    };
    const lvl = st.predicciones[0]?.nivelRiesgo;
    if (lvl === "alto") row.alto++;
    else if (lvl === "medio") row.medio++;
    else if (lvl === "bajo") row.bajo++;
    riskByGradoMap.set(gradoNum, row);
  }
  const riskByGrado = [...riskByGradoMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, v]) => v);

  // Asistencia por grado honesta: solo alumnos con asistencia computable 2026.
  // Los grados sin evidencia se omiten del dataset (el frontend muestra empty state).
  const studentGradoNum = new Map<string, number>();
  for (const st of studentsWithSection) {
    const gradoNum = st.seccion?.grado?.numero
      ?? Number(st.seccion?.grado?.nombre?.match(/(\d+)/)?.[1] || 0);
    if (gradoNum) studentGradoNum.set(String(st.id), gradoNum);
  }
  const attendanceByGradoMap = new Map<number, { grado: string; promedio: number; count: number }>();
  for (const [studentKey, pct] of studentAttPct) {
    const gradoNum = studentGradoNum.get(studentKey);
    if (!gradoNum) continue;
    const row = attendanceByGradoMap.get(gradoNum) ?? { grado: `${gradoNum}°`, promedio: 0, count: 0 };
    row.promedio += pct;
    row.count++;
    attendanceByGradoMap.set(gradoNum, row);
  }
  const attendanceByGrado = [...attendanceByGradoMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, v]) => ({
      grado: v.grado,
      asistencia: Math.round((v.promedio / v.count) * 10) / 10,
    }));

  const lmsByGradoMap = new Map<
    number,
    { grado: string; alta: number; media: number; baja: number; sin: number }
  >();
  for (const row of lmsIndicadores) {
    const num = row.seccion?.grado?.numero ?? 0;
    if (!num) continue;
    const g = lmsByGradoMap.get(num) ?? { grado: `${num}°`, alta: 0, media: 0, baja: 0, sin: 0 };
    const f = new Set(row.resourceEvents.map(e => e.createdAt.toISOString().slice(0, 10))).size * 100 / 28;
    if (f >= 70) g.alta++;
    else if (f >= 40) g.media++;
    else if (f > 0) g.baja++;
    else g.sin++;
    lmsByGradoMap.set(num, g);
  }
  const lmsActivityByGrado = [...lmsByGradoMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, v]) => v);

  const riskTrend = buildRiskTrendSeries(
    recentPredictions.map((p) => ({ score: Number(p.score), createdAt: p.createdAt })),
  );

  const mlMetrics = await getMlMetrics();
  const featureImportance = extractFeatureImportance(mlMetrics);
  const modelComparison = extractModelComparison(mlMetrics);

  // Estado del modelo experimental (V6) para el dashboard del director.
  const evaluatedRows = studentsWithSection.filter((st) => st.predicciones[0]);
  const probabilities = evaluatedRows
    .map((st) => Number(st.predicciones[0]?.probabilidadAbandono ?? NaN))
    .filter((value) => Number.isFinite(value));
  const avgProbability = probabilities.length
    ? Math.round((probabilities.reduce((a, b) => a + b, 0) / probabilities.length) * 1000) / 1000
    : null;
  const prioritized = evaluatedRows
    .map((st) => ({
      studentId: idToString(st.id),
      codigo: st.codigo,
      nombres: st.nombres,
      apellidos: st.apellidos,
      nivel: st.predicciones[0]?.nivelRiesgo ?? null,
      probabilidad: Number(st.predicciones[0]?.probabilidadAbandono ?? 0),
    }))
    .filter((row) => row.nivel === "alto" || row.nivel === "medio")
    .sort((a, b) => b.probabilidad - a.probabilidad)
    .slice(0, 10);
  const mlMeta = (mlMetrics ?? {}) as Record<string, unknown>;
  const ml = {
    dataMode: typeof mlMeta.data_mode === "string" ? mlMeta.data_mode : null,
    datasetVersion: typeof mlMeta.dataset_version === "string" ? mlMeta.dataset_version : null,
    modelVersion: typeof mlMeta.model_version === "string" ? mlMeta.model_version : null,
    modelSelected: typeof mlMeta.best_model === "string" ? mlMeta.best_model : null,
    contractVersion: typeof mlMeta.contract_version === "string" ? mlMeta.contract_version : null,
    decisionThreshold: typeof mlMeta.decision_threshold === "number" ? mlMeta.decision_threshold : null,
    riskThresholds: (mlMeta.risk_thresholds ?? null) as Record<string, unknown> | null,
    nFeatures: typeof mlMeta.n_features === "number" ? mlMeta.n_features : null,
    metricsAvailable: mlMetrics != null,
    experimental: (typeof mlMeta.data_mode === "string" ? mlMeta.data_mode : null) === "synthetic_scientific",
    evaluated: evaluatedRows.length,
    evaluatedTotal: totalStudents,
    avgProbability,
    byLevel,
    alertsActive: openAlerts,
    prioritized,
  };

  const [instConfig, directorUser] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { clave: "institucion.nombre" } }),
    prisma.user.findFirst({
      where: { activo: true, rol: { codigo: "admin" } },
      orderBy: { id: "asc" },
      select: { nombres: true, apellidos: true, email: true },
    }),
  ]);

  return {
    kpis: {
      totalStudents,
      totalTeachers,
      totalSalones,
      openAlerts,
      avgRisk: avgRisk._avg.score == null ? null : Math.round(Number(avgRisk._avg.score) * 10) / 10,
      avgGrade: avgGradeValue,
      avgAttendance: avgAttendanceValue,
      byLevel,
      alertsByLevel: Object.fromEntries(alertsByLevel.map((a) => [a.nivelRiesgo, a._count])),
      institutionName: instConfig?.valor ?? "I.E.P. Blenkir",
      directorName: directorUser
        ? `${directorUser.nombres} ${directorUser.apellidos}`.trim()
        : null,
      directorEmail: directorUser?.email ?? null,
    },
    ml,
    riskTrend,
    riskBySection,
    riskByGrado,
    attendanceByGrado,
    lmsActivityByGrado,
    alertsBySalonShort,
    modelComparison,
    featureImportance,
  };
}

function buildRiskTrendSeries(
  predictions: { score: number; createdAt: Date }[],
): { periodo: string; riesgoGlobal: number; count: number }[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const p of [...predictions].reverse()) {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key) ?? { sum: 0, count: 0 };
    b.sum += p.score;
    b.count++;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, { sum, count }]) => ({
      periodo,
      riesgoGlobal: Math.round((sum / count) * 10) / 10,
      count,
    }));
}

function extractModelComparison(metrics: unknown) {
  if (!metrics || typeof metrics !== "object") return [];
  const m = metrics as Record<string, { f1_score?: number; accuracy?: number }>;
  const keys = ["random_forest", "xgboost", "hist_gradient_boosting", "stacking"];
  return keys
    .filter((k) => m[k]?.f1_score != null)
    .map((k) => ({
      modelo: k.replaceAll("_", " "),
      f1: Math.round((m[k].f1_score ?? 0) * 1000) / 10,
      accuracy: Math.round((m[k].accuracy ?? 0) * 1000) / 10,
    }));
}

function extractFeatureImportance(metrics: unknown): { variable: string; peso: number }[] {
  const values = (metrics as { feature_importance?: Record<string, number> })?.feature_importance;
  return values ? Object.entries(values).map(([variable, peso]) => ({ variable, peso })) : [];
}
