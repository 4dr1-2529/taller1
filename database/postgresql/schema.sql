-- =============================================================================
-- TESIS DASHBOARD — Modelo relacional PostgreSQL (I.E.P. Huancayo, Perú)
-- Ensemble learning + fusión datos académicos y LMS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================== ROLES Y PERMISOS =====================
CREATE TABLE roles (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(32) UNIQUE NOT NULL,
  nombre      VARCHAR(64) NOT NULL,
  descripcion TEXT
);

CREATE TABLE permisos (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(64) UNIQUE NOT NULL,
  modulo      VARCHAR(64) NOT NULL
);

CREATE TABLE rol_permiso (
  rol_id      INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id  INT NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

-- ===================== USUARIOS Y SESIONES =====================
CREATE TABLE usuarios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  nombres         VARCHAR(120) NOT NULL,
  apellidos       VARCHAR(120) NOT NULL,
  rol_id          INT NOT NULL REFERENCES roles(id),
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sesiones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) NOT NULL,
  ip_address      INET,
  user_agent      TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);

-- ===================== ENTIDADES ACADÉMICAS =====================
CREATE TABLE profesores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo          VARCHAR(32) UNIQUE NOT NULL,
  nombres         VARCHAR(120) NOT NULL,
  apellidos       VARCHAR(120) NOT NULL,
  especialidad    VARCHAR(120),
  correo          VARCHAR(255) UNIQUE NOT NULL,
  telefono        VARCHAR(20),
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cursos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo          VARCHAR(32) UNIQUE NOT NULL,
  nombre          VARCHAR(200) NOT NULL,
  nivel           VARCHAR(64) NOT NULL,
  profesor_id     UUID NOT NULL REFERENCES profesores(id),
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cursos_profesor ON cursos(profesor_id);

CREATE TABLE estudiantes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo              VARCHAR(32) UNIQUE NOT NULL,
  nombres             VARCHAR(120) NOT NULL,
  apellidos           VARCHAR(120) NOT NULL,
  nivel               VARCHAR(64) NOT NULL,
  correo              VARCHAR(255) NOT NULL,
  telefono            VARCHAR(20),
  estado              VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo','en_riesgo','retirado')),
  promedio_general    NUMERIC(4,2) DEFAULT 12,
  asistencia_general  NUMERIC(5,2) DEFAULT 80,
  lms_engagement      VARCHAR(16) DEFAULT 'medio',
  activo              BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_estudiantes_estado ON estudiantes(estado);

CREATE TABLE matriculas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  curso_id        UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  promedio        NUMERIC(4,2) NOT NULL,
  asistencia_pct  NUMERIC(5,2) NOT NULL,
  periodo         VARCHAR(16) NOT NULL DEFAULT '2026-I',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (estudiante_id, curso_id, periodo)
);

-- ===================== HISTORIAL Y LMS =====================
CREATE TABLE historial_academico (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  periodo         VARCHAR(16) NOT NULL,
  promedio        NUMERIC(4,2) NOT NULL,
  asistencia      NUMERIC(5,2) NOT NULL,
  observacion     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE actividad_lms (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id       UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  semana              VARCHAR(16) NOT NULL,
  actividad_pct       NUMERIC(5,2) NOT NULL,
  minutos             INT NOT NULL,
  tareas_entregadas   INT NOT NULL,
  tareas_totales      INT NOT NULL,
  horas_plataforma    NUMERIC(5,2) NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asistencias (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL,
  presente        BOOLEAN NOT NULL,
  justificado     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== IA Y RIESGO =====================
CREATE TABLE predicciones_ia (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  score           NUMERIC(5,2) NOT NULL,
  nivel_riesgo    VARCHAR(16) NOT NULL CHECK (nivel_riesgo IN ('bajo','medio','alto')),
  probabilidad    NUMERIC(5,4),
  modelo_version  VARCHAR(64) NOT NULL,
  modelo_nombre   VARCHAR(120) NOT NULL,
  factores_json   JSONB NOT NULL,
  meta_json       JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predicciones_estudiante ON predicciones_ia(estudiante_id, created_at DESC);
CREATE INDEX idx_predicciones_nivel ON predicciones_ia(nivel_riesgo);

CREATE TABLE riesgo_estudiantil (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  score           NUMERIC(5,2) NOT NULL,
  nivel_riesgo    VARCHAR(16) NOT NULL,
  periodo         VARCHAR(16) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alertas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  titulo          VARCHAR(200) NOT NULL,
  descripcion     TEXT NOT NULL,
  factor_clave    VARCHAR(64),
  nivel_riesgo    VARCHAR(16) NOT NULL,
  estado          VARCHAR(24) DEFAULT 'abierta',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recomendaciones_ia (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  factor_clave    VARCHAR(64) NOT NULL,
  titulo          VARCHAR(200) NOT NULL,
  detalle         TEXT NOT NULL,
  aplicada        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== SEGUIMIENTO Y NOTIFICACIONES =====================
CREATE TABLE seguimiento_psicologico (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL,
  resumen         TEXT NOT NULL,
  acciones        TEXT,
  profesional     VARCHAR(120),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notificaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo            VARCHAR(32) NOT NULL,
  titulo          VARCHAR(200) NOT NULL,
  mensaje         TEXT NOT NULL,
  leida           BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reportes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo          VARCHAR(200) NOT NULL,
  tipo            VARCHAR(64) NOT NULL,
  generado_por    UUID REFERENCES usuarios(id),
  archivo_path    TEXT,
  meta_json       JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dashboard_analytics (
  id                  SERIAL PRIMARY KEY,
  periodo             VARCHAR(16) UNIQUE NOT NULL,
  riesgo_global       NUMERIC(5,2) NOT NULL,
  total_estudiantes   INT NOT NULL,
  alertas_abiertas    INT NOT NULL,
  meta_json           JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== AUDITORÍA Y CHAT =====================
CREATE TABLE bitacora_auditoria (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidad         VARCHAR(64) NOT NULL,
  entidad_id      UUID,
  accion          VARCHAR(32) NOT NULL,
  usuario_id      UUID REFERENCES usuarios(id),
  detalle         TEXT,
  ip_address      INET,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bitacora_entidad ON bitacora_auditoria(entidad, created_at DESC);

CREATE TABLE chat_mensajes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id         VARCHAR(64) NOT NULL,
  remitente_id    UUID NOT NULL,
  remitente_nombre VARCHAR(120) NOT NULL,
  rol             VARCHAR(32) NOT NULL,
  contenido       TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== VISTAS =====================
CREATE OR REPLACE VIEW v_estudiantes_riesgo AS
SELECT e.id, e.codigo, e.nombres, e.apellidos, e.estado,
       p.score, p.nivel_riesgo, p.probabilidad, p.created_at AS ultima_prediccion
FROM estudiantes e
LEFT JOIN LATERAL (
  SELECT score, nivel_riesgo, probabilidad, created_at
  FROM predicciones_ia
  WHERE estudiante_id = e.id
  ORDER BY created_at DESC LIMIT 1
) p ON TRUE
WHERE e.activo = TRUE;

CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM estudiantes WHERE activo) AS total_estudiantes,
  (SELECT COUNT(*) FROM alertas WHERE estado = 'abierta') AS alertas_abiertas,
  (SELECT ROUND(AVG(score)::numeric, 2) FROM predicciones_ia
   WHERE created_at >= NOW() - INTERVAL '30 days') AS riesgo_promedio_30d;

-- ===================== TRIGGERS =====================
CREATE OR REPLACE FUNCTION fn_audit_estudiante()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bitacora_auditoria (entidad, entidad_id, accion, detalle)
  VALUES ('estudiantes', COALESCE(NEW.id, OLD.id), TG_OP, row_to_json(COALESCE(NEW, OLD))::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_estudiantes
AFTER INSERT OR UPDATE OR DELETE ON estudiantes
FOR EACH ROW EXECUTE FUNCTION fn_audit_estudiante();

CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_estudiantes_updated BEFORE UPDATE ON estudiantes
FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ===================== PROCEDIMIENTO: ALERTAS AUTOMÁTICAS =====================
CREATE OR REPLACE PROCEDURE sp_generar_alertas_riesgo(umbral_score NUMERIC DEFAULT 41)
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO alertas (estudiante_id, titulo, descripcion, factor_clave, nivel_riesgo, estado)
  SELECT p.estudiante_id,
         'Alerta temprana — riesgo ' || p.nivel_riesgo,
         'Score predictivo: ' || p.score,
         (p.factores_json->0->>'key'),
         p.nivel_riesgo,
         'abierta'
  FROM predicciones_ia p
  INNER JOIN (
    SELECT estudiante_id, MAX(created_at) AS mx FROM predicciones_ia GROUP BY estudiante_id
  ) ult ON p.estudiante_id = ult.estudiante_id AND p.created_at = ult.mx
  WHERE p.score >= umbral_score
    AND p.nivel_riesgo IN ('medio', 'alto')
    AND NOT EXISTS (
      SELECT 1 FROM alertas a
      WHERE a.estudiante_id = p.estudiante_id AND a.estado = 'abierta'
    );
END;
$$;
