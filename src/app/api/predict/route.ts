import { NextResponse } from "next/server";
import { computePrediction } from "@/lib/risk-model";
import type { StudentAcademicMetrics, StudentStatus } from "@/types/academic";

type PredictBody = {
  metrics: StudentAcademicMetrics;
  estado: StudentStatus;
};

function isMetrics(value: unknown): value is StudentAcademicMetrics {
  if (!value || typeof value !== "object") return false;
  const m = value as StudentAcademicMetrics;
  return (
    typeof m.promedioGeneral === "number" &&
    typeof m.asistenciaGeneral === "number" &&
    !!m.lms &&
    typeof m.lms === "object" &&
    Array.isArray(m.lms.actividadSemanalPct) &&
    Array.isArray(m.lms.minutosPorSemana) &&
    typeof m.lms.tareasEntregadas === "number" &&
    typeof m.lms.tareasTotales === "number" &&
    typeof m.lms.horasPlataformaSemana === "number"
  );
}

export async function POST(request: Request) {
  let body: PredictBody;
  try {
    body = (await request.json()) as PredictBody;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!isMetrics(body.metrics)) {
    return NextResponse.json({ ok: false, error: "metrics inválido" }, { status: 400 });
  }

  const estado: StudentStatus =
    body.estado === "activo" || body.estado === "en riesgo" || body.estado === "retirado"
      ? body.estado
      : "activo";

  const prediction = computePrediction(body.metrics, estado);

  return NextResponse.json({
    ok: true,
    prediction,
    version: "local-typescript-ensemble-sim",
    mlServiceHint:
      "Sustituir por POST al servicio Python en ml-service cuando el modelo esté entrenado.",
  });
}
