-- =============================================================================
-- TESIS DASHBOARD v2 — PostgreSQL
-- I.E.P. Huancayo, Perú · Primaria + Secundaria · Riesgo de deserción (IA)
-- Sincronizado con backend/prisma/schema.prisma
-- =============================================================================

-- ─── Extensiones ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tipos enumerados ────────────────────────────────────────────────────────
CREATE TYPE "UserRole" AS ENUM (
  'admin', 'docente', 'tutor', 'psicologo', 'estudiante', 'apoderado'
);
CREATE TYPE "NivelCodigo" AS ENUM ('primaria', 'secundaria');
CREATE TYPE "StudentStatus" AS ENUM ('activo', 'en_riesgo', 'retirado');
CREATE TYPE "RiskLevel" AS ENUM ('bajo', 'medio', 'alto');
CREATE TYPE "AlertStatus" AS ENUM ('abierta', 'en_seguimiento', 'resuelta');
CREATE TYPE "NotificationType" AS ENUM ('alerta', 'prediccion', 'sistema', 'reporte');
CREATE TYPE "DiaSemana" AS ENUM (
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'
);

-- ─── RBAC ────────────────────────────────────────────────────────────────────
CREATE TABLE "Role" (
  id          SERIAL PRIMARY KEY,
  codigo      "UserRole" NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Permission" (
  id       SERIAL PRIMARY KEY,
  codigo   TEXT NOT NULL UNIQUE,
  modulo   TEXT NOT NULL
);

CREATE TABLE "RolePermission" (
  "roleId"       INT NOT NULL REFERENCES "Role"(id) ON DELETE CASCADE,
  "permissionId" INT NOT NULL REFERENCES "Permission"(id) ON DELETE CASCADE,
  PRIMARY KEY ("roleId", "permissionId")
);

-- ─── Usuarios y sesiones ─────────────────────────────────────────────────────
CREATE TABLE "User" (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  nombres        TEXT NOT NULL,
  apellidos      TEXT NOT NULL,
  role           "UserRole" NOT NULL DEFAULT 'estudiante',
  dni            TEXT UNIQUE,
  telefono       TEXT,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "User_role_idx" ON "User"(role);
CREATE INDEX "User_activo_idx" ON "User"(activo);

CREATE TABLE "Session" (
  id                 TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "tokenHash"        TEXT NOT NULL,
  "refreshHash"      TEXT,
  "ipAddress"        TEXT,
  "userAgent"        TEXT,
  "expiresAt"        TIMESTAMPTZ NOT NULL,
  "refreshExpiresAt" TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- ─── Estructura educativa Perú ───────────────────────────────────────────────
CREATE TABLE "NivelEducativo" (
  id          SERIAL PRIMARY KEY,
  codigo      "NivelCodigo" NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Grado" (
  id        SERIAL PRIMARY KEY,
  "nivelId" INT NOT NULL REFERENCES "NivelEducativo"(id) ON DELETE CASCADE,
  numero    INT NOT NULL,
  nombre    TEXT NOT NULL,
  UNIQUE ("nivelId", numero)
);
CREATE INDEX "Grado_nivelId_idx" ON "Grado"("nivelId");

CREATE TABLE "Teacher" (
  id            TEXT PRIMARY KEY,
  "userId"      TEXT UNIQUE REFERENCES "User"(id),
  codigo        TEXT NOT NULL UNIQUE,
  nombres       TEXT NOT NULL,
  apellidos     TEXT NOT NULL,
  especialidad  TEXT NOT NULL,
  correo        TEXT NOT NULL,
  telefono      TEXT,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Teacher_activo_idx" ON "Teacher"(activo);

CREATE TABLE "Seccion" (
  id          TEXT PRIMARY KEY,
  "gradoId"   INT NOT NULL REFERENCES "Grado"(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  capacidad   INT NOT NULL DEFAULT 30,
  "tutorId"   TEXT REFERENCES "Teacher"(id),
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("gradoId", nombre)
);
CREATE INDEX "Seccion_gradoId_idx" ON "Seccion"("gradoId");
CREATE INDEX "Seccion_tutorId_idx" ON "Seccion"("tutorId");

CREATE TABLE "CursoCatalogo" (
  id          TEXT PRIMARY KEY,
  codigo      TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  area        TEXT NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "CursoPorGrado" (
  id                TEXT PRIMARY KEY,
  "gradoId"         INT NOT NULL REFERENCES "Grado"(id) ON DELETE CASCADE,
  "cursoCatalogoId" TEXT NOT NULL REFERENCES "CursoCatalogo"(id) ON DELETE CASCADE,
  "horasSemanales"  INT NOT NULL DEFAULT 2,
  UNIQUE ("gradoId", "cursoCatalogoId")
);

-- ─── Apoderados y estudiantes ────────────────────────────────────────────────
CREATE TABLE "Apoderado" (
  id         TEXT PRIMARY KEY,
  "userId"   TEXT UNIQUE REFERENCES "User"(id),
  dni        TEXT NOT NULL UNIQUE,
  nombres    TEXT NOT NULL,
  apellidos  TEXT NOT NULL,
  correo     TEXT,
  telefono   TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Student" (
  id                  TEXT PRIMARY KEY,
  "userId"            TEXT UNIQUE REFERENCES "User"(id),
  codigo              TEXT NOT NULL UNIQUE,
  nombres             TEXT NOT NULL,
  apellidos           TEXT NOT NULL,
  dni                 TEXT UNIQUE,
  correo              TEXT,
  telefono            TEXT,
  "seccionId"         TEXT REFERENCES "Seccion"(id),
  estado              "StudentStatus" NOT NULL DEFAULT 'activo',
  "promedioGeneral"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "asistenciaGeneral" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lmsEngagement"     TEXT NOT NULL DEFAULT 'medio',
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  "fechaIngreso"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Student_estado_idx" ON "Student"(estado);
CREATE INDEX "Student_activo_idx" ON "Student"(activo);
CREATE INDEX "Student_seccionId_idx" ON "Student"("seccionId");

CREATE TABLE "StudentApoderado" (
  "studentId"   TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  "apoderadoId" TEXT NOT NULL REFERENCES "Apoderado"(id) ON DELETE CASCADE,
  parentesco    TEXT NOT NULL DEFAULT 'apoderado',
  principal     BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY ("studentId", "apoderadoId")
);

-- ─── Cursos, matrícula, horarios ─────────────────────────────────────────────
CREATE TABLE "Course" (
  id                TEXT PRIMARY KEY,
  codigo            TEXT NOT NULL UNIQUE,
  "cursoCatalogoId" TEXT REFERENCES "CursoCatalogo"(id),
  nombre            TEXT NOT NULL,
  "profesorId"      TEXT NOT NULL REFERENCES "Teacher"(id),
  "seccionId"       TEXT,
  periodo           TEXT NOT NULL DEFAULT '2026',
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Course_profesorId_idx" ON "Course"("profesorId");
CREATE INDEX "Course_seccionId_idx" ON "Course"("seccionId");
CREATE INDEX "Course_activo_idx" ON "Course"(activo);

CREATE TABLE "Enrollment" (
  id          TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  "courseId"  TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  periodo     TEXT NOT NULL DEFAULT '2026-I',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId", "courseId", periodo)
);
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

CREATE TABLE "Horario" (
  id          TEXT PRIMARY KEY,
  "seccionId" TEXT NOT NULL REFERENCES "Seccion"(id) ON DELETE CASCADE,
  "courseId"  TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  dia         "DiaSemana" NOT NULL,
  "horaInicio" TEXT NOT NULL,
  "horaFin"    TEXT NOT NULL,
  aula        TEXT
);
CREATE INDEX "Horario_seccionId_idx" ON "Horario"("seccionId");
CREATE INDEX "Horario_courseId_idx" ON "Horario"("courseId");

-- ─── Académico ───────────────────────────────────────────────────────────────
CREATE TABLE "Grade" (
  id          TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  "courseId"  TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  periodo     TEXT NOT NULL,
  bimestre    INT NOT NULL,
  nota        DOUBLE PRECISION NOT NULL,
  observacion TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId", "courseId", periodo, bimestre),
  CONSTRAINT grade_nota_range CHECK (nota >= 0 AND nota <= 20)
);
CREATE INDEX "Grade_studentId_idx" ON "Grade"("studentId");
CREATE INDEX "Grade_courseId_idx" ON "Grade"("courseId");

CREATE TABLE "AcademicHistory" (
  id          TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  periodo     TEXT NOT NULL,
  promedio    DOUBLE PRECISION NOT NULL,
  asistencia  DOUBLE PRECISION NOT NULL,
  observacion TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "AcademicHistory_student_periodo_idx" ON "AcademicHistory"("studentId", periodo);

CREATE TABLE "LmsActivity" (
  id                 TEXT PRIMARY KEY,
  "studentId"        TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  semana             TEXT NOT NULL,
  "actividadPct"     DOUBLE PRECISION NOT NULL,
  minutos            INT NOT NULL,
  "tareasEntregadas" INT NOT NULL,
  "tareasTotales"    INT NOT NULL,
  "horasPlataforma"  DOUBLE PRECISION NOT NULL,
  conexiones         INT NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "LmsActivity_student_semana_idx" ON "LmsActivity"("studentId", semana);

CREATE TABLE "Attendance" (
  id          TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  fecha       DATE NOT NULL,
  presente    BOOLEAN NOT NULL,
  justificado BOOLEAN NOT NULL DEFAULT FALSE,
  tardanza    BOOLEAN NOT NULL DEFAULT FALSE,
  observacion TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId", fecha)
);
CREATE INDEX "Attendance_student_fecha_idx" ON "Attendance"("studentId", fecha);

-- ─── IA y riesgo ─────────────────────────────────────────────────────────────
CREATE TABLE "Prediction" (
  id            TEXT PRIMARY KEY,
  "studentId"   TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  score         DOUBLE PRECISION NOT NULL,
  level         "RiskLevel" NOT NULL,
  probability   DOUBLE PRECISION,
  "modelVersion" TEXT NOT NULL,
  "modelName"   TEXT NOT NULL,
  "factorsJson" TEXT NOT NULL,
  "metaJson"    TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Prediction_student_created_idx" ON "Prediction"("studentId", "createdAt");
CREATE INDEX "Prediction_level_idx" ON "Prediction"(level);

CREATE TABLE "StudentRisk" (
  id          TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  score       DOUBLE PRECISION NOT NULL,
  level       "RiskLevel" NOT NULL,
  periodo     TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "StudentRisk_student_periodo_idx" ON "StudentRisk"("studentId", periodo);

CREATE TABLE "Alert" (
  id          TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  "factorKey" TEXT,
  level       "RiskLevel" NOT NULL,
  status      "AlertStatus" NOT NULL DEFAULT 'abierta',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Alert_status_level_idx" ON "Alert"(status, level);
CREATE INDEX "Alert_studentId_idx" ON "Alert"("studentId");

CREATE TABLE "AiRecommendation" (
  id          TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  "factorKey" TEXT NOT NULL,
  titulo      TEXT NOT NULL,
  detalle     TEXT NOT NULL,
  aplicada    BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "AiRecommendation_studentId_idx" ON "AiRecommendation"("studentId");

CREATE TABLE "PsychologicalFollowUp" (
  id            TEXT PRIMARY KEY,
  "studentId"   TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  fecha         TIMESTAMPTZ NOT NULL,
  resumen       TEXT NOT NULL,
  acciones      TEXT,
  profesional   TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "PsychologicalFollowUp_studentId_idx" ON "PsychologicalFollowUp"("studentId");

-- ─── Sistema ─────────────────────────────────────────────────────────────────
CREATE TABLE "Notification" (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  tipo        "NotificationType" NOT NULL,
  titulo      TEXT NOT NULL,
  mensaje     TEXT NOT NULL,
  leida       BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Notification_user_leida_idx" ON "Notification"("userId", leida);

CREATE TABLE "Report" (
  id            TEXT PRIMARY KEY,
  titulo        TEXT NOT NULL,
  tipo          TEXT NOT NULL,
  "generadoPor" TEXT,
  "archivoPath" TEXT,
  "metaJson"    TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "DashboardSnapshot" (
  id                 TEXT PRIMARY KEY,
  periodo            TEXT NOT NULL UNIQUE,
  "riesgoGlobal"     DOUBLE PRECISION NOT NULL,
  "totalEstudiantes" INT NOT NULL,
  "alertasAbiertas"  INT NOT NULL,
  "metaJson"         TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "SystemConfig" (
  id          TEXT PRIMARY KEY,
  clave       TEXT NOT NULL UNIQUE,
  valor       TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "AuditLog" (
  id          TEXT PRIMARY KEY,
  entidad     TEXT NOT NULL,
  "entidadId" TEXT,
  accion      TEXT NOT NULL,
  "usuarioId" TEXT REFERENCES "User"(id),
  detalle     TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "studentId" TEXT REFERENCES "Student"(id),
  "teacherId" TEXT REFERENCES "Teacher"(id)
);
CREATE INDEX "AuditLog_entidad_created_idx" ON "AuditLog"(entidad, "createdAt");
CREATE INDEX "AuditLog_usuarioId_idx" ON "AuditLog"("usuarioId");

CREATE TABLE "ChatMessage" (
  id          TEXT PRIMARY KEY,
  "roomId"    TEXT NOT NULL,
  "senderId"  TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "senderRole" "UserRole" NOT NULL,
  contenido   TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "ChatMessage_room_created_idx" ON "ChatMessage"("roomId", "createdAt");

-- =============================================================================
-- TRIGGERS — auditoría y updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_updated BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE PROCEDURE fn_set_updated_at();
CREATE TRIGGER tr_student_updated BEFORE UPDATE ON "Student"
  FOR EACH ROW EXECUTE PROCEDURE fn_set_updated_at();
CREATE TRIGGER tr_teacher_updated BEFORE UPDATE ON "Teacher"
  FOR EACH ROW EXECUTE PROCEDURE fn_set_updated_at();
CREATE TRIGGER tr_course_updated BEFORE UPDATE ON "Course"
  FOR EACH ROW EXECUTE PROCEDURE fn_set_updated_at();
CREATE TRIGGER tr_seccion_updated BEFORE UPDATE ON "Seccion"
  FOR EACH ROW EXECUTE PROCEDURE fn_set_updated_at();
CREATE TRIGGER tr_alert_updated BEFORE UPDATE ON "Alert"
  FOR EACH ROW EXECUTE PROCEDURE fn_set_updated_at();
CREATE TRIGGER tr_enrollment_updated BEFORE UPDATE ON "Enrollment"
  FOR EACH ROW EXECUTE PROCEDURE fn_set_updated_at();

CREATE OR REPLACE FUNCTION fn_audit_student_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "AuditLog" (id, entidad, "entidadId", accion, "studentId", detalle, "createdAt")
  VALUES (
    gen_random_uuid()::text,
    'Student',
    COALESCE(NEW.id, OLD.id),
    TG_OP::text,
    COALESCE(NEW.id, OLD.id),
    COALESCE(row_to_json(NEW), row_to_json(OLD))::text,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_student_audit
  AFTER INSERT OR UPDATE OR DELETE ON "Student"
  FOR EACH ROW EXECUTE PROCEDURE fn_audit_student_change();

-- =============================================================================
-- VISTAS
-- =============================================================================

CREATE OR REPLACE VIEW vw_estructura_academica AS
SELECT
  ne.codigo AS nivel_codigo,
  ne.nombre AS nivel_nombre,
  g.numero AS grado_numero,
  g.nombre AS grado_nombre,
  s.id AS seccion_id,
  s.nombre AS seccion_nombre,
  s.capacidad,
  COUNT(st.id) FILTER (WHERE st.activo) AS estudiantes_activos
FROM "NivelEducativo" ne
JOIN "Grado" g ON g."nivelId" = ne.id
JOIN "Seccion" s ON s."gradoId" = g.id AND s.activo
LEFT JOIN "Student" st ON st."seccionId" = s.id
GROUP BY ne.codigo, ne.nombre, g.numero, g.nombre, s.id, s.nombre, s.capacidad
ORDER BY ne.codigo, g.numero, s.nombre;

CREATE OR REPLACE VIEW vw_riesgo_estudiantil AS
SELECT
  st.id,
  st.codigo,
  st.nombres,
  st.apellidos,
  ne.nombre AS nivel,
  g.nombre AS grado,
  sec.nombre AS seccion,
  st."promedioGeneral",
  st."asistenciaGeneral",
  st."lmsEngagement",
  st.estado,
  p.score AS ultimo_score,
  p.level AS ultimo_riesgo,
  p.probability,
  p."createdAt" AS ultima_prediccion
FROM "Student" st
LEFT JOIN "Seccion" sec ON sec.id = st."seccionId"
LEFT JOIN "Grado" g ON g.id = sec."gradoId"
LEFT JOIN "NivelEducativo" ne ON ne.id = g."nivelId"
LEFT JOIN LATERAL (
  SELECT score, level, probability, "createdAt"
  FROM "Prediction"
  WHERE "studentId" = st.id
  ORDER BY "createdAt" DESC
  LIMIT 1
) p ON TRUE
WHERE st.activo;

CREATE OR REPLACE VIEW vw_dashboard_kpis AS
SELECT
  COUNT(*) FILTER (WHERE st.activo) AS total_estudiantes,
  COUNT(*) FILTER (WHERE st.estado = 'en_riesgo') AS estudiantes_en_riesgo,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('abierta', 'en_seguimiento')) AS alertas_abiertas,
  ROUND(AVG(st."promedioGeneral")::numeric, 2) AS promedio_institucional,
  ROUND(AVG(st."asistenciaGeneral")::numeric, 2) AS asistencia_institucional
FROM "Student" st
LEFT JOIN "Alert" a ON a."studentId" = st.id;

-- =============================================================================
-- PROCEDIMIENTOS
-- =============================================================================

CREATE OR REPLACE PROCEDURE sp_registrar_nota(
  p_student_id TEXT,
  p_course_id TEXT,
  p_periodo TEXT,
  p_bimestre INT,
  p_nota DOUBLE PRECISION,
  p_observacion TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_nota < 0 OR p_nota > 20 THEN
    RAISE EXCEPTION 'Nota fuera de rango (0-20)';
  END IF;
  INSERT INTO "Grade" (id, "studentId", "courseId", periodo, bimestre, nota, observacion)
  VALUES (gen_random_uuid()::text, p_student_id, p_course_id, p_periodo, p_bimestre, p_nota, p_observacion)
  ON CONFLICT ("studentId", "courseId", periodo, bimestre)
  DO UPDATE SET nota = EXCLUDED.nota, observacion = EXCLUDED.observacion;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_snapshot_dashboard(p_periodo TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_riesgo DOUBLE PRECISION;
  v_total INT;
  v_alertas INT;
BEGIN
  SELECT
    COALESCE(AVG(p.score), 0),
    COUNT(DISTINCT st.id),
    COUNT(DISTINCT al.id)
  INTO v_riesgo, v_total, v_alertas
  FROM "Student" st
  LEFT JOIN LATERAL (
    SELECT score FROM "Prediction" WHERE "studentId" = st.id ORDER BY "createdAt" DESC LIMIT 1
  ) p ON TRUE
  LEFT JOIN "Alert" al ON al."studentId" = st.id AND al.status IN ('abierta', 'en_seguimiento')
  WHERE st.activo;

  INSERT INTO "DashboardSnapshot" (id, periodo, "riesgoGlobal", "totalEstudiantes", "alertasAbiertas")
  VALUES (gen_random_uuid()::text, p_periodo, v_riesgo, v_total, v_alertas)
  ON CONFLICT (periodo) DO UPDATE SET
    "riesgoGlobal" = EXCLUDED."riesgoGlobal",
    "totalEstudiantes" = EXCLUDED."totalEstudiantes",
    "alertasAbiertas" = EXCLUDED."alertasAbiertas",
    "createdAt" = NOW();
END;
$$;
