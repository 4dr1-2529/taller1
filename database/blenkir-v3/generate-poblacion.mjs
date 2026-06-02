#!/usr/bin/env node
/**
 * Genera 03-seed-poblacion.sql — 660 estudiantes Blenkir Primaria
 * Uso: node database/blenkir-v3/generate-poblacion.mjs > database/blenkir-v3/03-seed-poblacion.sql
 */
const PWD =
  "$2a$12$JTmnq1jHDMOgBHOUH0o2ne0CpvWXJzaRahmeg2YVjb6HB.p.73686";

const NOMBRES = [
  "Mateo", "Valentina", "Santiago", "Luciana", "Sebastián", "Camila", "Diego", "Isabella",
  "Alejandro", "Sofía", "Daniel", "Mariana", "Andrés", "Emilia", "Gabriel", "Victoria",
  "Emilio", "Mía", "Thiago", "Abigail", "Benjamín", "Emma", "Maximiliano", "Olivia",
  "Leonardo", "Amelia", "Felipe", "Martina", "Tomás", "Catalina",
];
const APELLIDOS = [
  "Quispe", "Flores", "García", "Torres", "Mamani", "Rojas", "Díaz", "Chávez",
  "Vega", "Castro", "Silva", "Herrera", "Morales", "Paredes", "Salazar", "Condori",
  "Huamán", "Apaza", "Ccoa", "Limachi",
];

function esc(s) {
  return String(s).replace(/'/g, "''");
}

function seccionSql(grado, seccion) {
  return `(SELECT s.id FROM seccion s JOIN grado g ON s.grado_id = g.id WHERE g.numero = ${grado} AND s.nombre = '${seccion}')`;
}

function buildSections() {
  const out = [];
  for (let g = 1; g <= 4; g++) {
    for (const s of ["A", "B", "C", "D"]) out.push({ grado: g, seccion: s });
  }
  for (let g = 5; g <= 6; g++) {
    for (const s of ["A", "B", "C"]) out.push({ grado: g, seccion: s });
  }
  return out;
}

const sections = buildSections();
const lines = [];

lines.push("-- =============================================================================");
lines.push("-- I.E.P. BLENKIR — Población: 660 estudiantes + apoderados + datos ML base");
lines.push("-- Generado automáticamente — NO editar manualmente");
lines.push("-- =============================================================================");
lines.push("");
lines.push("USE tesis_blenkir;");
lines.push("SET NAMES utf8mb4;");
lines.push("SET FOREIGN_KEY_CHECKS = 0;");
lines.push(`SET @pwd := '${PWD}';`);
lines.push("SET @rol_est := (SELECT id FROM rol WHERE codigo = 'estudiante');");
lines.push("SET @anio := (SELECT id FROM anio_lectivo WHERE anio = 2026);");
lines.push("SET @periodo1 := (SELECT id FROM periodo_academico WHERE anio_lectivo_id = @anio AND numero = 1);");
lines.push("");

let n = 0;
for (const sec of sections) {
  for (let i = 0; i < 30; i++) {
    n++;
    const num = String(n).padStart(4, "0");
    const email = `estudiante${num}@blenkir.edu.pe`;
    const nom = NOMBRES[i % NOMBRES.length];
    const ape1 = APELLIDOS[(n + i) % APELLIDOS.length];
    const ape2 = APELLIDOS[(n * 2 + i) % APELLIDOS.length];
    const dni = String(70000000 + n).padStart(8, "0");
    const codigo = `EST-2026-${num}`;
    const secId = seccionSql(sec.grado, sec.seccion);

    // Métricas variadas para ML (distribución realista)
    const promedio = (8 + ((n * 7) % 110) / 10).toFixed(2);
    const asistencia = (72 + ((n * 3) % 28)).toFixed(2);
    const estado = n % 17 === 0 ? "en_riesgo" : n % 53 === 0 ? "retirado" : "activo";

    lines.push(`-- Estudiante ${num} — ${sec.grado}° ${sec.seccion}`);
    lines.push(`INSERT INTO usuario (rol_id, email, password_hash, nombres, apellidos, dni, activo) VALUES`);
    lines.push(`(@rol_est, '${email}', @pwd, '${esc(nom)}', '${esc(ape1 + " " + ape2)}', '${dni}', 1);`);
    lines.push(`SET @u${n} := LAST_INSERT_ID();`);

    lines.push(`INSERT INTO estudiante (usuario_id, codigo, nombres, apellidos, dni, email, seccion_id, estado, promedio_general, asistencia_general, fecha_ingreso) VALUES`);
    lines.push(`(@u${n}, '${codigo}', '${esc(nom)}', '${esc(ape1 + " " + ape2)}', '${dni}', '${email}', ${secId}, '${estado}', ${promedio}, ${asistencia}, '2026-03-01');`);
    lines.push(`SET @e${n} := LAST_INSERT_ID();`);

    lines.push(`INSERT INTO apoderado (dni, nombres, apellidos, email, telefono) VALUES`);
    lines.push(`('${String(80000000 + n)}', 'Apoderado', '${esc(ape1)}', 'apoderado${num}@mail.com', '9${String(10000000 + n).slice(-8)}');`);
    lines.push(`SET @a${n} := LAST_INSERT_ID();`);
    lines.push(`INSERT INTO estudiante_apoderado (estudiante_id, apoderado_id, parentesco, es_principal) VALUES (@e${n}, @a${n}, 'padre/madre', 1);`);

    lines.push(`INSERT INTO matricula (estudiante_id, seccion_id, anio_lectivo_id, codigo, fecha_matricula) VALUES`);
    lines.push(`(@e${n}, ${secId}, @anio, 'MAT-${codigo}', '2026-03-01');`);

    lines.push(`INSERT INTO inscripcion_curso (estudiante_id, curso_oferta_id)`);
    lines.push(`SELECT @e${n}, co.id FROM curso_oferta co WHERE co.seccion_id = ${secId} AND co.anio_lectivo_id = @anio;`);

    // LMS indicadores (periodo 1)
    const freq = (40 + ((n * 5) % 55)).toFixed(2);
    const tareas = (0.45 + ((n * 3) % 55) / 100).toFixed(3);
    const foros = (0.2 + ((n * 2) % 80) / 100).toFixed(3);
    const caid = (n % 11 === 0 ? 15 + (n % 20) : n % 7).toFixed(2);
    lines.push(`INSERT INTO lms_indicador_estudiante (estudiante_id, periodo_id, frecuencia_acceso, tiempo_plataforma, tareas_ratio, participacion, uso_foros, disminucion_actividad) VALUES`);
    lines.push(`(@e${n}, @periodo1, ${freq}, ${(2 + (n % 8)).toFixed(1)}, ${tareas}, ${freq}, ${foros}, ${caid});`);

    lines.push(`INSERT INTO historial_academico (estudiante_id, periodo_id, promedio, cursos_desaprobados, asistencia_pct) VALUES`);
    lines.push(`(@e${n}, @periodo1, ${promedio}, ${parseFloat(promedio) < 11 ? 2 : parseFloat(promedio) < 13 ? 1 : 0}, ${asistencia});`);

    lines.push(`INSERT INTO resumen_asistencia (estudiante_id, periodo_id, dias_registrados, dias_presentes, porcentaje) VALUES`);
    lines.push(`(@e${n}, @periodo1, 40, ${Math.round(40 * parseFloat(asistencia) / 100)}, ${asistencia});`);
    lines.push("");
  }
}

// Actualizar snapshot dashboard
lines.push(`UPDATE dashboard_snapshot SET total_estudiantes = 660,`);
lines.push(`  riesgo_bajo = (SELECT COUNT(*) FROM estudiante WHERE estado = 'activo' AND promedio_general >= 13),`);
lines.push(`  riesgo_medio = (SELECT COUNT(*) FROM estudiante WHERE estado = 'en_riesgo'),`);
lines.push(`  riesgo_alto = (SELECT COUNT(*) FROM estudiante WHERE estado = 'retirado' OR promedio_general < 11)`);
lines.push(`WHERE anio_lectivo_id = @anio;`);
lines.push("");
lines.push("SET FOREIGN_KEY_CHECKS = 1;");
lines.push(`-- Total estudiantes insertados: ${n}`);

process.stdout.write(lines.join("\n"));
