/**
 * Generador de predicciones experimentales V6 (Data Seed V6).
 *
 * Modos:
 *   --preview  (por defecto)  SÓLO LECTURA. No abre base de datos ni escribe nada.
 *                             Toma las siete features del CSV V6 (snapshot T2) y
 *                             las envía al servicio FastAPI para mostrar la
 *                             distribución de riesgo esperada en la exposición.
 *   --write                   Escribe Prediction (+ Alert) en la BD.
 *                             Se REHÚSA si el destino parece productivo
 *                             (Railway / NODE_ENV=production / host no local)
 *                             salvo ALLOW_SYNTHETIC_PREDICTION_WRITE=true.
 *   --limit=N                 Limita el número de estudiantes en modo --write.
 *
 * Uso:
 *   ML_DATA_MODE=synthetic_scientific ML_SERVICE_URL=http://localhost:5000 \
 *     npx tsx backend/scripts/predict-all-v6.ts --preview
 */
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const ML_DIR = path.join(ROOT, "machine-learning");
const V6_CSV = path.join(ML_DIR, "data", "synthetic-scientific-v6", "BLENKIR_ML_DATASET_V6_SYNTHETIC.csv");
const PREVIEW_OUT = path.join(ML_DIR, "artifacts", "synthetic", "predictions-preview.json");

const FEATURE_NAMES = [
  "promedio_general",
  "cursos_desaprobados",
  "asistencia_general",
  "frecuencia_acceso_lms",
  "tiempo_interaccion_lms",
  "actividades_realizadas",
  "recursos_consultados",
];

const args = process.argv.slice(2);
const WRITE_MODE = args.includes("--write");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const ML_URL = (process.env.ML_SERVICE_URL || "http://localhost:5000").replace(/\/$/, "");
const DATA_MODE = (process.env.ML_DATA_MODE || "synthetic_scientific").toLowerCase();

function flag(name) {
  return process.env[name] === "true";
}

function extractHost(databaseUrl) {
  try {
    return new URL(String(databaseUrl).replace(/^"|"$/g, "")).hostname;
  } catch {
    return "";
  }
}

/** Detección de destino productivo sin imprimir nunca la URL ni credenciales. */
function targetInfo() {
  const host = extractHost(process.env.DATABASE_URL || "");
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0", ""]);
  const isLocalHost = localHosts.has(host);
  const railway = Boolean(
    process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_SERVICE_NAME,
  );
  const nodeProduction = process.env.NODE_ENV === "production";
  return {
    hostIsLocal: isLocalHost,
    hostConfigured: host !== "",
    railway,
    nodeProduction,
    isProduction: !isLocalHost || railway || nodeProduction,
  };
}

async function readV6Snapshot() {
  if (!existsSync(V6_CSV)) throw new Error(`Dataset V6 no encontrado: ${V6_CSV}`);
  const rows = [];
  const reader = createInterface({ input: createReadStream(V6_CSV, { encoding: "utf8" }), crlfDelay: Infinity });
  let header = null;
  for await (const line of reader) {
    if (!line.trim()) continue;
    const cells = line.split(",");
    if (!header) {
      header = cells.map((c) => c.trim());
      continue;
    }
    const row = {};
    header.forEach((key, index) => { row[key] = (cells[index] ?? "").trim(); });
    rows.push(row);
  }
  // Último snapshot disponible por estudiante (T2: 2026-09-21).
  const latest = new Map();
  for (const row of rows) {
    const previous = latest.get(row.student_code);
    if (!previous || String(row.snapshot_id) > String(previous.snapshot_id)) {
      latest.set(row.student_code, row);
    }
  }
  return [...latest.values()];
}

async function callPredict(features) {
  const res = await fetch(`${ML_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`ML /predict respondió ${res.status}`);
  return res.json();
}

function summarise(results) {
  const levels = { bajo: 0, medio: 0, alto: 0 };
  let sum = 0;
  for (const r of results) {
    levels[r.nivelRiesgo] = (levels[r.nivelRiesgo] ?? 0) + 1;
    sum += r.probabilidadDesercion;
  }
  return {
    evaluados: results.length,
    porNivel: levels,
    probabilidadMedia: results.length ? Math.round((sum / results.length) * 1000) / 1000 : null,
  };
}

async function runPreview() {
  const rows = await readV6Snapshot();
  const results = [];
  for (const row of rows) {
    const features = Object.fromEntries(FEATURE_NAMES.map((name) => [name, Number(row[name])]));
    try {
      const out = await callPredict(features);
      results.push({
        studentCode: row.student_code,
        snapshotId: row.snapshot_id,
        nivelRiesgo: out.nivelRiesgo,
        probabilidadDesercion: out.probabilidadDesercion,
        score: out.score,
        modelo: out.modelo,
        modelVersion: out.modelVersion,
        datasetVersion: out.datasetVersion,
        dataMode: out.dataMode,
        contractVersion: out.contractVersion,
        factors: out.factors,
      });
    } catch (error) {
      console.error(`ERROR estudiante ${row.student_code}: ${error.message}`);
    }
  }
  const summary = summarise(results);
  mkdirSync(path.dirname(PREVIEW_OUT), { recursive: true });
  const payload = {
    mode: "preview-read-only",
    generatedAt: new Date().toISOString(),
    source: "machine-learning/data/synthetic-scientific-v6/BLENKIR_ML_DATASET_V6_SYNTHETIC.csv",
    snapshot: "T2 (2026-09-21)",
    databaseWrites: 0,
    ...summary,
    topRiesgo: [...results].sort((a, b) => b.probabilidadDesercion - a.probabilidadDesercion).slice(0, 10),
    results,
  };
  writeFileSync(PREVIEW_OUT, JSON.stringify(payload, null, 2), "utf8");

  console.log(`PREVIEW_MODE=read-only DATABASE_WRITES=0`);
  console.log(`ML_URL=${ML_URL} DATA_MODE=${DATA_MODE}`);
  console.log(`EVALUADOS=${summary.evaluados}`);
  console.log(`NIVEL_BAJO=${summary.porNivel.bajo} NIVEL_MEDIO=${summary.porNivel.medio} NIVEL_ALTO=${summary.porNivel.alto}`);
  console.log(`PROBABILIDAD_MEDIA=${summary.probabilidadMedia}`);
  console.log(`PREVIEW_FILE=${PREVIEW_OUT}`);
}

async function runWrite() {
  const target = targetInfo();
  const allowed = flag("ALLOW_SYNTHETIC_PREDICTION_WRITE");
  console.log(
    `TARGET hostIsLocal=${target.hostIsLocal} hostConfigured=${target.hostConfigured} ` +
      `railway=${target.railway} nodeProduction=${target.nodeProduction} ` +
      `isProduction=${target.isProduction} allowFlag=${allowed}`,
  );
  if (target.isProduction && !allowed) {
    console.error(
      "WRITE_REFUSED: el destino parece productivo (Railway / NODE_ENV=production / host no local). " +
        "Defina ALLOW_SYNTHETIC_PREDICTION_WRITE=true de forma explícita para autorizar la escritura " +
        "de predicciones sintéticas, o ejecute contra una base de datos local/dev.",
    );
    process.exitCode = 2;
    return;
  }

  const { PrismaClient } = await import("@prisma/client");
  const { studentIndicators } = await import("../src/services/lms.service.js");
  const { buildMlPayload, predictWithMl } = await import("../src/services/ml-client.js");
  const { persistPrediction } = await import("../src/services/prediction-persistence.service.js");
  const { idToString } = await import("../src/utils/ids.js");
  const prisma = new PrismaClient();

  try {
    const admin = await prisma.user.findFirst({
      where: { activo: true, rol: { codigo: "admin" } },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    const actorId = String(admin?.id ?? "1");
    const students = await prisma.student.findMany({
      where: { activo: true },
      select: { id: true, codigo: true, nombres: true, apellidos: true, predicciones: { select: { modelName: true, inputData: true }, orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { id: "asc" },
      ...(Number.isFinite(LIMIT) ? { take: LIMIT } : {}),
    });
    console.log(`STUDENTS_CANDIDATES=${students.length}`);

    let written = 0, skippedExisting = 0, skippedNoData = 0, mlErrors = 0, alerts = 0;
    for (const student of students) {
      const metrics = await studentIndicators(student.id);
      if (metrics.promedio_general === null || metrics.asistencia_general === null) {
        skippedNoData++;
        continue;
      }
      const payload = buildMlPayload(metrics);
      const ml = await predictWithMl(payload);
      if (!ml) {
        mlErrors++;
        continue;
      }
      const modelVersion = ml.modelVersion ?? "unknown";
      const previous = student.predicciones[0];
      const previousMeta = (previous?.inputData && typeof previous.inputData === "object" ? previous.inputData : {});
      if (previousMeta.modelVersion === modelVersion) {
        skippedExisting++;
        continue;
      }
      const probability = ml.probabilidadDesercion ?? ml.probability_abandono ?? ml.probability;
      const { alert } = await persistPrediction(
        student.id,
        {
          score: ml.score,
          level: (ml.nivelRiesgo ?? ml.level) as "bajo" | "medio" | "alto",
          probability,
          probabilityAbandono: probability,
          factors: ml.factors ?? [],
          modelName: ml.modelo ?? ml.model_name,
          recommendation: ml.recommendation ?? "",
          predictedAt: ml.predicted_at ?? new Date().toISOString(),
          inputData: payload,
          modelVersion,
          datasetVersion: ml.datasetVersion,
          dataMode: ml.dataMode,
          contractVersion: ml.contractVersion ?? "2026-v3",
          decisionThreshold: ml.decisionThreshold ?? (ml as { decision_threshold?: number }).decision_threshold,
        },
        actorId,
        "127.0.0.1",
      );
      written++;
      if (alert) alerts++;
      if (written % 25 === 0) console.log(`PROGRESS written=${written} student=${idToString(student.id)}`);
    }

    const totals = await prisma.prediction.groupBy({ by: ["nivelRiesgo"], _count: true });
    console.log(
      `WRITE_DONE written=${written} skippedExisting=${skippedExisting} ` +
        `skippedNoData=${skippedNoData} mlErrors=${mlErrors} alertsCreated=${alerts}`,
    );
    console.log(`PREDICTIONS_BY_LEVEL=${JSON.stringify(Object.fromEntries(totals.map((t) => [t.nivelRiesgo, t._count])))}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (WRITE_MODE) {
  await runWrite();
} else {
  await runPreview();
}
