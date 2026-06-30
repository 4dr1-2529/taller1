/**
 * Pruebas smoke del API — requiere backend en :4000 y opcional ML en :5000
 * Ejecutar: node scripts/smoke-tests.mjs
 */
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const ML = process.env.ML_URL ?? "http://localhost:5000";

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}:`, e.message);
  }
}

async function main() {
  await test("health API", async () => {
    const r = await fetch(`${API}/health`);
    if (!r.ok) throw new Error(`status ${r.status}`);
  });

  await test("ML health", async () => {
    const r = await fetch(`${ML}/health`);
    if (!r.ok) throw new Error(`status ${r.status}`);
  });

  await test("ML predict bajo/medio/alto", async () => {
    const cases = [
      { promedio_general: 16, asistencia_general: 95, actividad_lms_prom: 85, tareas_ratio: 0.9, estado: "activo" },
      { promedio_general: 11, asistencia_general: 78, actividad_lms_prom: 50, tareas_ratio: 0.65, estado: "en_riesgo" },
      { promedio_general: 7, asistencia_general: 55, actividad_lms_prom: 20, tareas_ratio: 0.25, estado: "retirado" },
    ];
    for (const body of cases) {
      const r = await fetch(`${ML}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`predict ${r.status}`);
      const j = await r.json();
      if (!["bajo", "medio", "alto"].includes(j.level)) throw new Error(`level inválido ${j.level}`);
      if (typeof j.score !== "number") throw new Error("sin score");
      if (!j.recommendation) throw new Error("sin recomendación");
      if (j.probabilidad_abandono == null) throw new Error("sin probabilidad_abandono (formato tesis)");
      if (!j.nivel_riesgo) throw new Error("sin nivel_riesgo");
    }
  });

  await test("login director (si existe seed)", async () => {
    const creds = [
      { email: "director@blenkir.edu.pe", password: "mbappe29" },
      { email: "director@iep-huancayo.edu.pe", password: "mbappe29" },
      { email: "admin@iep-huancayo.edu.pe", password: "mbappe29" },
    ];
    let token = null;
    for (const body of creds) {
      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        const j = await r.json();
        token = j.data?.token ?? j.token;
        break;
      }
    }
    if (!token) {
      console.warn("  (login omitido — ejecute db:seed:demo)");
      return;
    }

    const pred = await fetch(`${API}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    if (pred.status !== 400 && pred.status !== 404) {
      // puede fallar sin studentId — esperado
    }

    const hist = await fetch(`${API}/predictions?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!hist.ok) throw new Error(`historial ${hist.status}`);

    const alerts = await fetch(`${API}/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!alerts.ok) throw new Error(`alerts ${alerts.status}`);

    const dash = await fetch(`${API}/dashboard/kpis`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!dash.ok) throw new Error(`dashboard ${dash.status}`);
    const dashJson = await dash.json();
    const kpis = dashJson.data?.kpis ?? dashJson.kpis;
    if (!kpis?.byLevel) throw new Error("dashboard sin byLevel");

    const students = await fetch(`${API}/students?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (students.ok) {
      const st = await students.json();
      const items = st.data?.items ?? st.items;
      const sid = items?.[0]?.id;
      if (sid) {
        const predRes = await fetch(`${API}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ studentId: sid }),
        });
        if (!predRes.ok) throw new Error(`predict student ${predRes.status}`);
        const pj = await predRes.json();
        const p = pj.data?.prediction ?? pj.prediction;
        if (p?.probabilidad_abandono == null && p?.probabilityAbandono == null && p?.probabilidad == null) {
          throw new Error("predicción sin probabilidad");
        }
        if (!p?.nivel_riesgo && !p?.level && !p?.nivelRiesgo) throw new Error("predicción sin nivel");
      }
    }
  });

  console.log(`\n${passed} ok, ${failed} fallos`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
