-- =============================================================================
-- I.E.P. BLENKIR — Esquema v3.0
-- Sistema de predicción de riesgo de deserción estudiantil (Primaria)
-- MySQL 8.0+ · InnoDB · utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS tesis_blenkir
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tesis_blenkir;

-- ─── MÓDULO 1: INSTITUCIÓN ─────────────────────────────────────────────────

CREATE TABLE institucion (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)     NOT NULL,
  nombre          VARCHAR(200)    NOT NULL,
  ruc             VARCHAR(11)     NULL,
  direccion       VARCHAR(255)    NULL,
  ubigeo          VARCHAR(6)      NULL,
  telefono        VARCHAR(20)     NULL,
  email           VARCHAR(120)    NULL,
  activo          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_institucion_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE anio_lectivo (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  institucion_id  BIGINT UNSIGNED NOT NULL,
  anio            SMALLINT        NOT NULL,
  nombre          VARCHAR(50)     NOT NULL,
  fecha_inicio    DATE            NOT NULL,
  fecha_fin       DATE            NOT NULL,
  activo          TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_anio_inst (institucion_id, anio),
  CONSTRAINT fk_anio_institucion FOREIGN KEY (institucion_id)
    REFERENCES institucion (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE periodo_academico (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  anio_lectivo_id BIGINT UNSIGNED NOT NULL,
  numero          TINYINT         NOT NULL COMMENT '1-4 bimestre',
  nombre          VARCHAR(40)     NOT NULL,
  fecha_inicio    DATE            NOT NULL,
  fecha_fin       DATE            NOT NULL,
  activo          TINYINT(1)      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_periodo_anio (anio_lectivo_id, numero),
  CONSTRAINT fk_periodo_anio FOREIGN KEY (anio_lectivo_id)
    REFERENCES anio_lectivo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── MÓDULO 2: ESTRUCTURA ACADÉMICA ────────────────────────────────────────

CREATE TABLE nivel_educativo (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)     NOT NULL,
  nombre          VARCHAR(80)     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_nivel_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE grado (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nivel_id        BIGINT UNSIGNED NOT NULL,
  numero          TINYINT         NOT NULL COMMENT '1-6 primaria',
  nombre          VARCHAR(60)     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_grado_nivel_num (nivel_id, numero),
  KEY idx_grado_nivel (nivel_id),
  CONSTRAINT fk_grado_nivel FOREIGN KEY (nivel_id)
    REFERENCES nivel_educativo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE seccion (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grado_id        BIGINT UNSIGNED NOT NULL,
  nombre          CHAR(1)         NOT NULL COMMENT 'A B C D',
  capacidad       SMALLINT        NOT NULL DEFAULT 30,
  activo          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_seccion_grado_nombre (grado_id, nombre),
  KEY idx_seccion_grado (grado_id),
  CONSTRAINT fk_seccion_grado FOREIGN KEY (grado_id)
    REFERENCES grado (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE area_curricular (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)     NOT NULL,
  nombre          VARCHAR(80)     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_area_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE curso_catalogo (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  area_id         BIGINT UNSIGNED NOT NULL,
  codigo          VARCHAR(20)     NOT NULL,
  nombre          VARCHAR(100)    NOT NULL,
  descripcion     VARCHAR(255)    NULL,
  horas_semanales TINYINT         NOT NULL DEFAULT 2,
  activo          TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_curso_codigo (codigo),
  KEY idx_curso_area (area_id),
  CONSTRAINT fk_curso_area FOREIGN KEY (area_id)
    REFERENCES area_curricular (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE curso_grado (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grado_id        BIGINT UNSIGNED NOT NULL,
  curso_id        BIGINT UNSIGNED NOT NULL,
  obligatorio     TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_curso_grado (grado_id, curso_id),
  CONSTRAINT fk_cg_grado FOREIGN KEY (grado_id) REFERENCES grado (id) ON DELETE CASCADE,
  CONSTRAINT fk_cg_curso FOREIGN KEY (curso_id) REFERENCES curso_catalogo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── MÓDULO 3: SEGURIDAD ───────────────────────────────────────────────────

CREATE TABLE rol (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          ENUM('admin','docente','estudiante') NOT NULL,
  nombre          VARCHAR(50)     NOT NULL,
  descripcion     VARCHAR(255)    NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_rol_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE permiso (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(60)     NOT NULL,
  modulo          VARCHAR(40)     NOT NULL,
  descripcion     VARCHAR(255)    NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permiso_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE rol_permiso (
  rol_id          BIGINT UNSIGNED NOT NULL,
  permiso_id      BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT fk_rp_rol FOREIGN KEY (rol_id) REFERENCES rol (id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permiso FOREIGN KEY (permiso_id) REFERENCES permiso (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE usuario (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rol_id          BIGINT UNSIGNED NOT NULL,
  email           VARCHAR(120)    NOT NULL,
  password_hash   VARCHAR(255)    NOT NULL,
  nombres         VARCHAR(80)     NOT NULL,
  apellidos       VARCHAR(80)     NOT NULL,
  dni             VARCHAR(8)      NULL,
  telefono        VARCHAR(20)     NULL,
  activo          TINYINT(1)      NOT NULL DEFAULT 1,
  ultimo_acceso   DATETIME(3)     NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuario_email (email),
  UNIQUE KEY uk_usuario_dni (dni),
  KEY idx_usuario_rol (rol_id),
  KEY idx_usuario_activo (activo),
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES rol (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sesion (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      BIGINT UNSIGNED NOT NULL,
  token_hash      VARCHAR(128)    NOT NULL,
  refresh_hash    VARCHAR(128)    NULL,
  ip_address      VARCHAR(45)     NULL,
  user_agent      VARCHAR(255)    NULL,
  expires_at      DATETIME(3)     NOT NULL,
  refresh_expires DATETIME(3)     NULL,
  revocada        TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_sesion_usuario (usuario_id),
  KEY idx_sesion_expira (expires_at),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE intento_login (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email           VARCHAR(120)    NOT NULL,
  ip_address      VARCHAR(45)     NULL,
  exitoso         TINYINT(1)      NOT NULL DEFAULT 0,
  motivo          VARCHAR(100)    NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_intento_email_fecha (email, created_at)
) ENGINE=InnoDB;

-- ─── MÓDULO 4: PERSONAS ────────────────────────────────────────────────────

CREATE TABLE profesor (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      BIGINT UNSIGNED NULL,
  codigo          VARCHAR(20)     NOT NULL,
  nombres         VARCHAR(80)     NOT NULL,
  apellidos       VARCHAR(80)     NOT NULL,
  especialidad    VARCHAR(80)     NOT NULL,
  email           VARCHAR(120)    NOT NULL,
  telefono        VARCHAR(20)     NULL,
  activo          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_profesor_codigo (codigo),
  UNIQUE KEY uk_profesor_usuario (usuario_id),
  KEY idx_profesor_activo (activo),
  CONSTRAINT fk_profesor_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE estudiante (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      BIGINT UNSIGNED NULL,
  codigo          VARCHAR(20)     NOT NULL,
  nombres         VARCHAR(80)     NOT NULL,
  apellidos       VARCHAR(80)     NOT NULL,
  dni             VARCHAR(8)      NULL,
  email           VARCHAR(120)    NULL,
  telefono        VARCHAR(20)     NULL,
  seccion_id      BIGINT UNSIGNED NULL,
  estado          ENUM('activo','en_riesgo','retirado') NOT NULL DEFAULT 'activo',
  promedio_general DECIMAL(4,2)   NOT NULL DEFAULT 0,
  asistencia_general DECIMAL(5,2) NOT NULL DEFAULT 0,
  activo          TINYINT(1)      NOT NULL DEFAULT 1,
  fecha_ingreso   DATE            NOT NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_estudiante_codigo (codigo),
  UNIQUE KEY uk_estudiante_usuario (usuario_id),
  UNIQUE KEY uk_estudiante_dni (dni),
  KEY idx_estudiante_seccion (seccion_id),
  KEY idx_estudiante_estado (estado, activo),
  CONSTRAINT fk_estudiante_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON DELETE SET NULL,
  CONSTRAINT fk_estudiante_seccion FOREIGN KEY (seccion_id)
    REFERENCES seccion (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE apoderado (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dni             VARCHAR(8)      NOT NULL,
  nombres         VARCHAR(80)     NOT NULL,
  apellidos       VARCHAR(80)     NOT NULL,
  email           VARCHAR(120)    NULL,
  telefono        VARCHAR(20)     NOT NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_apoderado_dni (dni)
) ENGINE=InnoDB;

CREATE TABLE estudiante_apoderado (
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  apoderado_id    BIGINT UNSIGNED NOT NULL,
  parentesco      VARCHAR(30)     NOT NULL DEFAULT 'apoderado',
  es_principal    TINYINT(1)      NOT NULL DEFAULT 0,
  PRIMARY KEY (estudiante_id, apoderado_id),
  CONSTRAINT fk_ea_estudiante FOREIGN KEY (estudiante_id)
    REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_ea_apoderado FOREIGN KEY (apoderado_id)
    REFERENCES apoderado (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── MÓDULO 5: OFERTA Y MATRÍCULA ────────────────────────────────────────

CREATE TABLE tutor_seccion (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  seccion_id      BIGINT UNSIGNED NOT NULL,
  profesor_id     BIGINT UNSIGNED NOT NULL,
  anio_lectivo_id BIGINT UNSIGNED NOT NULL,
  activo          TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tutor_seccion_anio (seccion_id, anio_lectivo_id),
  CONSTRAINT fk_ts_seccion FOREIGN KEY (seccion_id) REFERENCES seccion (id) ON DELETE CASCADE,
  CONSTRAINT fk_ts_profesor FOREIGN KEY (profesor_id) REFERENCES profesor (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ts_anio FOREIGN KEY (anio_lectivo_id) REFERENCES anio_lectivo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE curso_oferta (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  curso_id        BIGINT UNSIGNED NOT NULL,
  seccion_id      BIGINT UNSIGNED NOT NULL,
  profesor_id     BIGINT UNSIGNED NOT NULL,
  anio_lectivo_id BIGINT UNSIGNED NOT NULL,
  codigo          VARCHAR(30)     NOT NULL,
  activo          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_oferta_codigo (codigo),
  UNIQUE KEY uk_oferta_curso_sec_anio (curso_id, seccion_id, anio_lectivo_id),
  KEY idx_oferta_seccion (seccion_id),
  KEY idx_oferta_profesor (profesor_id),
  CONSTRAINT fk_co_curso FOREIGN KEY (curso_id) REFERENCES curso_catalogo (id) ON DELETE RESTRICT,
  CONSTRAINT fk_co_seccion FOREIGN KEY (seccion_id) REFERENCES seccion (id) ON DELETE CASCADE,
  CONSTRAINT fk_co_profesor FOREIGN KEY (profesor_id) REFERENCES profesor (id) ON DELETE RESTRICT,
  CONSTRAINT fk_co_anio FOREIGN KEY (anio_lectivo_id) REFERENCES anio_lectivo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE matricula (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  seccion_id      BIGINT UNSIGNED NOT NULL,
  anio_lectivo_id BIGINT UNSIGNED NOT NULL,
  codigo          VARCHAR(30)     NOT NULL,
  estado          ENUM('activa','retirada','trasladada') NOT NULL DEFAULT 'activa',
  fecha_matricula DATE            NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_matricula_codigo (codigo),
  UNIQUE KEY uk_matricula_est_anio (estudiante_id, anio_lectivo_id),
  KEY idx_matricula_seccion (seccion_id, anio_lectivo_id),
  CONSTRAINT fk_mat_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_mat_seccion FOREIGN KEY (seccion_id) REFERENCES seccion (id) ON DELETE RESTRICT,
  CONSTRAINT fk_mat_anio FOREIGN KEY (anio_lectivo_id) REFERENCES anio_lectivo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inscripcion_curso (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  curso_oferta_id BIGINT UNSIGNED NOT NULL,
  estado          ENUM('activa','retirada') NOT NULL DEFAULT 'activa',
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_insc_est_oferta (estudiante_id, curso_oferta_id),
  KEY idx_insc_oferta (curso_oferta_id),
  CONSTRAINT fk_insc_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_insc_oferta FOREIGN KEY (curso_oferta_id) REFERENCES curso_oferta (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE horario_clase (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  curso_oferta_id BIGINT UNSIGNED NOT NULL,
  dia_semana      ENUM('lunes','martes','miercoles','jueves','viernes','sabado') NOT NULL,
  hora_inicio     TIME            NOT NULL,
  hora_fin        TIME            NOT NULL,
  aula            VARCHAR(20)     NULL,
  PRIMARY KEY (id),
  KEY idx_horario_oferta (curso_oferta_id),
  CONSTRAINT fk_horario_oferta FOREIGN KEY (curso_oferta_id)
    REFERENCES curso_oferta (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── MÓDULO 6: ACADÉMICO ───────────────────────────────────────────────────

CREATE TABLE calificacion (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  curso_oferta_id BIGINT UNSIGNED NOT NULL,
  periodo_id      BIGINT UNSIGNED NOT NULL,
  nota            DECIMAL(4,2)    NOT NULL CHECK (nota >= 0 AND nota <= 20),
  observacion     VARCHAR(255)    NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_calif (estudiante_id, curso_oferta_id, periodo_id),
  KEY idx_calif_estudiante (estudiante_id),
  CONSTRAINT fk_calif_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_calif_oferta FOREIGN KEY (curso_oferta_id) REFERENCES curso_oferta (id) ON DELETE CASCADE,
  CONSTRAINT fk_calif_periodo FOREIGN KEY (periodo_id) REFERENCES periodo_academico (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE historial_academico (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  periodo_id      BIGINT UNSIGNED NOT NULL,
  promedio        DECIMAL(4,2)    NOT NULL,
  cursos_desaprobados TINYINT     NOT NULL DEFAULT 0,
  asistencia_pct  DECIMAL(5,2)    NOT NULL DEFAULT 0,
  observacion     VARCHAR(255)    NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_hist_est_periodo (estudiante_id, periodo_id),
  CONSTRAINT fk_hist_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_periodo FOREIGN KEY (periodo_id) REFERENCES periodo_academico (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─── MÓDULO 7: ASISTENCIA ──────────────────────────────────────────────────

CREATE TABLE asistencia (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  fecha           DATE            NOT NULL,
  presente        TINYINT(1)      NOT NULL DEFAULT 1,
  tardanza        TINYINT(1)      NOT NULL DEFAULT 0,
  justificado     TINYINT(1)      NOT NULL DEFAULT 0,
  observacion     VARCHAR(255)    NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_asistencia_est_fecha (estudiante_id, fecha),
  KEY idx_asistencia_fecha (fecha),
  CONSTRAINT fk_asistencia_est FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE resumen_asistencia (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  periodo_id      BIGINT UNSIGNED NOT NULL,
  dias_registrados SMALLINT       NOT NULL DEFAULT 0,
  dias_presentes  SMALLINT        NOT NULL DEFAULT 0,
  porcentaje      DECIMAL(5,2)    NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_res_asist_est_per (estudiante_id, periodo_id),
  CONSTRAINT fk_res_asist_est FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_res_asist_per FOREIGN KEY (periodo_id) REFERENCES periodo_academico (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─── MÓDULO 8: LMS ─────────────────────────────────────────────────────────

CREATE TABLE lms_actividad_semanal (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  anio_semana     VARCHAR(8)      NOT NULL COMMENT '2026-W12',
  actividad_pct   DECIMAL(5,2)    NOT NULL DEFAULT 0,
  minutos         INT             NOT NULL DEFAULT 0,
  horas_plataforma DECIMAL(4,1)   NOT NULL DEFAULT 0,
  conexiones      INT             NOT NULL DEFAULT 0,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_lms_act_est_sem (estudiante_id, anio_semana),
  CONSTRAINT fk_lms_act_est FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lms_entrega_tarea (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  curso_oferta_id BIGINT UNSIGNED NOT NULL,
  periodo_id      BIGINT UNSIGNED NOT NULL,
  tareas_totales  SMALLINT        NOT NULL DEFAULT 0,
  tareas_entregadas SMALLINT      NOT NULL DEFAULT 0,
  ratio           DECIMAL(4,3)    NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_lms_tarea (estudiante_id, curso_oferta_id, periodo_id),
  CONSTRAINT fk_lms_tarea_est FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_lms_tarea_oferta FOREIGN KEY (curso_oferta_id) REFERENCES curso_oferta (id) ON DELETE CASCADE,
  CONSTRAINT fk_lms_tarea_per FOREIGN KEY (periodo_id) REFERENCES periodo_academico (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE lms_indicador_estudiante (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  periodo_id      BIGINT UNSIGNED NOT NULL,
  frecuencia_acceso DECIMAL(5,2)  NOT NULL DEFAULT 0,
  tiempo_plataforma DECIMAL(4,1)   NOT NULL DEFAULT 0,
  tareas_ratio    DECIMAL(4,3)     NOT NULL DEFAULT 0,
  participacion   DECIMAL(5,2)     NOT NULL DEFAULT 0,
  uso_foros       DECIMAL(4,3)     NOT NULL DEFAULT 0,
  disminucion_actividad DECIMAL(5,2) NOT NULL DEFAULT 0,
  updated_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_lms_ind_est_per (estudiante_id, periodo_id),
  CONSTRAINT fk_lms_ind_est FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_lms_ind_per FOREIGN KEY (periodo_id) REFERENCES periodo_academico (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─── MÓDULO 9: MACHINE LEARNING ────────────────────────────────────────────

CREATE TABLE ml_feature_def (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(40)     NOT NULL,
  nombre          VARCHAR(100)    NOT NULL,
  tipo_dato       VARCHAR(20)     NOT NULL,
  rango_min       DECIMAL(10,4)   NULL,
  rango_max       DECIMAL(10,4)   NULL,
  descripcion     VARCHAR(255)    NULL,
  orden           TINYINT         NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ml_feature_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE ml_dataset (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(40)     NOT NULL,
  version         VARCHAR(20)     NOT NULL,
  ruta_archivo    VARCHAR(500)    NULL,
  hash_sha256     VARCHAR(64)     NULL,
  registros       INT             NOT NULL DEFAULT 0,
  descripcion     TEXT            NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_ml_dataset_ver (codigo, version)
) ENGINE=InnoDB;

CREATE TABLE ml_entrenamiento (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dataset_id      BIGINT UNSIGNED NOT NULL,
  codigo          VARCHAR(40)     NOT NULL,
  algoritmos      JSON            NOT NULL COMMENT 'RF, XGB, Stacking',
  hiperparametros JSON            NULL,
  duracion_seg    INT             NULL,
  estado          ENUM('pendiente','ejecutando','completado','fallido') NOT NULL DEFAULT 'pendiente',
  iniciado_at     DATETIME(3)     NULL,
  finalizado_at   DATETIME(3)     NULL,
  log_texto       TEXT            NULL,
  PRIMARY KEY (id),
  KEY idx_ml_train_dataset (dataset_id),
  CONSTRAINT fk_ml_train_dataset FOREIGN KEY (dataset_id)
    REFERENCES ml_dataset (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE ml_modelo (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entrenamiento_id BIGINT UNSIGNED NOT NULL,
  codigo          VARCHAR(40)     NOT NULL,
  nombre          VARCHAR(80)     NOT NULL,
  ruta_artifact   VARCHAR(500)    NOT NULL,
  version         VARCHAR(20)     NOT NULL,
  es_produccion   TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_ml_modelo_codigo (codigo),
  KEY idx_ml_modelo_prod (es_produccion),
  CONSTRAINT fk_ml_modelo_train FOREIGN KEY (entrenamiento_id)
    REFERENCES ml_entrenamiento (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE ml_metrica (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  modelo_id       BIGINT UNSIGNED NOT NULL,
  accuracy        DECIMAL(6,4)    NULL,
  precision_macro DECIMAL(6,4)    NULL,
  recall_macro    DECIMAL(6,4)    NULL,
  f1_macro        DECIMAL(6,4)    NULL,
  matriz_confusion JSON           NULL,
  metricas_json   JSON            NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_ml_metrica_modelo (modelo_id),
  CONSTRAINT fk_ml_metrica_modelo FOREIGN KEY (modelo_id)
    REFERENCES ml_modelo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── MÓDULO 10: PREDICCIÓN ─────────────────────────────────────────────────

CREATE TABLE prediccion (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  modelo_id       BIGINT UNSIGNED NULL,
  score           DECIMAL(5,2)    NOT NULL,
  nivel_riesgo    ENUM('bajo','medio','alto') NOT NULL,
  probabilidad    DECIMAL(6,4)    NOT NULL,
  probabilidad_abandono DECIMAL(6,4) NOT NULL,
  periodo_id      BIGINT UNSIGNED NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_pred_est_fecha (estudiante_id, created_at DESC),
  KEY idx_pred_nivel (nivel_riesgo),
  CONSTRAINT fk_pred_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_pred_modelo FOREIGN KEY (modelo_id) REFERENCES ml_modelo (id) ON DELETE SET NULL,
  CONSTRAINT fk_pred_periodo FOREIGN KEY (periodo_id) REFERENCES periodo_academico (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE prediccion_feature_snapshot (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  prediccion_id   BIGINT UNSIGNED NOT NULL,
  feature_codigo  VARCHAR(40)     NOT NULL,
  valor_numerico  DECIMAL(12,4)   NULL,
  valor_texto     VARCHAR(50)     NULL,
  PRIMARY KEY (id),
  KEY idx_pfs_prediccion (prediccion_id),
  CONSTRAINT fk_pfs_prediccion FOREIGN KEY (prediccion_id)
    REFERENCES prediccion (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE prediccion_factor (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  prediccion_id   BIGINT UNSIGNED NOT NULL,
  factor_key      VARCHAR(40)     NOT NULL,
  etiqueta        VARCHAR(120)    NOT NULL,
  contribucion    DECIMAL(6,2)    NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_pf_prediccion (prediccion_id),
  CONSTRAINT fk_pf_prediccion FOREIGN KEY (prediccion_id)
    REFERENCES prediccion (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE recomendacion (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  prediccion_id   BIGINT UNSIGNED NULL,
  factor_key      VARCHAR(40)     NULL,
  titulo          VARCHAR(150)    NOT NULL,
  detalle         TEXT            NOT NULL,
  aplicada        TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_rec_estudiante (estudiante_id),
  CONSTRAINT fk_rec_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_rec_prediccion FOREIGN KEY (prediccion_id) REFERENCES prediccion (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── MÓDULO 11: ALERTAS ────────────────────────────────────────────────────

CREATE TABLE alerta (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estudiante_id   BIGINT UNSIGNED NOT NULL,
  prediccion_id   BIGINT UNSIGNED NULL,
  titulo          VARCHAR(150)    NOT NULL,
  descripcion     TEXT            NOT NULL,
  nivel_riesgo    ENUM('bajo','medio','alto') NOT NULL,
  score           DECIMAL(5,2)    NULL,
  probabilidad    DECIMAL(6,4)    NULL,
  estado          ENUM('nueva','en_seguimiento','resuelta') NOT NULL DEFAULT 'nueva',
  recomendacion   TEXT            NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_alerta_estado (estado, nivel_riesgo),
  KEY idx_alerta_estudiante (estudiante_id),
  CONSTRAINT fk_alerta_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE CASCADE,
  CONSTRAINT fk_alerta_prediccion FOREIGN KEY (prediccion_id) REFERENCES prediccion (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE alerta_historial (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alerta_id       BIGINT UNSIGNED NOT NULL,
  estado_anterior ENUM('nueva','en_seguimiento','resuelta') NULL,
  estado_nuevo    ENUM('nueva','en_seguimiento','resuelta') NOT NULL,
  usuario_id      BIGINT UNSIGNED NULL,
  comentario      VARCHAR(255)    NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_ah_alerta (alerta_id),
  CONSTRAINT fk_ah_alerta FOREIGN KEY (alerta_id) REFERENCES alerta (id) ON DELETE CASCADE,
  CONSTRAINT fk_ah_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE alerta_factor (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alerta_id       BIGINT UNSIGNED NOT NULL,
  factor_key      VARCHAR(40)     NOT NULL,
  etiqueta        VARCHAR(120)    NOT NULL,
  contribucion    DECIMAL(6,2)    NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_af_alerta (alerta_id),
  CONSTRAINT fk_af_alerta FOREIGN KEY (alerta_id) REFERENCES alerta (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── MÓDULO 12: MENSAJERÍA ─────────────────────────────────────────────────

CREATE TABLE mensaje_sala (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id         VARCHAR(60)     NOT NULL,
  alcance         ENUM('global','profesores','curso','directo') NOT NULL,
  titulo          VARCHAR(150)    NULL,
  curso_oferta_id BIGINT UNSIGNED NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_mensaje_sala_room (room_id),
  KEY idx_ms_curso (curso_oferta_id),
  CONSTRAINT fk_ms_curso FOREIGN KEY (curso_oferta_id)
    REFERENCES curso_oferta (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE mensaje (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sala_id         BIGINT UNSIGNED NOT NULL,
  remitente_id    BIGINT UNSIGNED NOT NULL,
  destinatario_id BIGINT UNSIGNED NULL,
  contenido       TEXT            NOT NULL,
  mensaje_padre_id BIGINT UNSIGNED NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_mensaje_sala_fecha (sala_id, created_at),
  KEY idx_mensaje_dest (destinatario_id),
  CONSTRAINT fk_mensaje_sala FOREIGN KEY (sala_id) REFERENCES mensaje_sala (id) ON DELETE CASCADE,
  CONSTRAINT fk_mensaje_remitente FOREIGN KEY (remitente_id) REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_mensaje_dest FOREIGN KEY (destinatario_id) REFERENCES usuario (id) ON DELETE SET NULL,
  CONSTRAINT fk_mensaje_padre FOREIGN KEY (mensaje_padre_id) REFERENCES mensaje (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE mensaje_lectura (
  mensaje_id      BIGINT UNSIGNED NOT NULL,
  usuario_id      BIGINT UNSIGNED NOT NULL,
  leido           TINYINT(1)      NOT NULL DEFAULT 0,
  leido_at        DATETIME(3)     NULL,
  PRIMARY KEY (mensaje_id, usuario_id),
  KEY idx_ml_usuario (usuario_id, leido),
  CONSTRAINT fk_ml_mensaje FOREIGN KEY (mensaje_id) REFERENCES mensaje (id) ON DELETE CASCADE,
  CONSTRAINT fk_ml_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── MÓDULO 13: AUDITORÍA, REPORTES, SISTEMA ───────────────────────────────

CREATE TABLE auditoria (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entidad         VARCHAR(60)     NOT NULL,
  entidad_id      VARCHAR(40)     NULL,
  accion          VARCHAR(40)     NOT NULL,
  usuario_id      BIGINT UNSIGNED NULL,
  estudiante_id   BIGINT UNSIGNED NULL,
  profesor_id     BIGINT UNSIGNED NULL,
  detalle         TEXT            NULL,
  ip_address      VARCHAR(45)     NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_audit_entidad (entidad, created_at),
  KEY idx_audit_usuario (usuario_id),
  CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante (id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_profesor FOREIGN KEY (profesor_id) REFERENCES profesor (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE reporte (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo          VARCHAR(150)    NOT NULL,
  tipo            VARCHAR(40)     NOT NULL,
  generado_por    BIGINT UNSIGNED NULL,
  ruta_archivo    VARCHAR(500)    NULL,
  meta_json       JSON            NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_reporte_tipo (tipo),
  CONSTRAINT fk_reporte_usuario FOREIGN KEY (generado_por) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE notificacion (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      BIGINT UNSIGNED NOT NULL,
  tipo            ENUM('alerta','prediccion','sistema','reporte') NOT NULL,
  titulo          VARCHAR(150)    NOT NULL,
  mensaje         TEXT            NOT NULL,
  leida           TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_notif_usuario (usuario_id, leida),
  CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dashboard_snapshot (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  anio_lectivo_id BIGINT UNSIGNED NOT NULL,
  periodo_id      BIGINT UNSIGNED NULL,
  total_estudiantes INT           NOT NULL DEFAULT 0,
  riesgo_bajo     INT             NOT NULL DEFAULT 0,
  riesgo_medio    INT             NOT NULL DEFAULT 0,
  riesgo_alto     INT             NOT NULL DEFAULT 0,
  alertas_abiertas INT            NOT NULL DEFAULT 0,
  meta_json       JSON            NULL,
  created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_dash_anio (anio_lectivo_id),
  CONSTRAINT fk_dash_anio FOREIGN KEY (anio_lectivo_id) REFERENCES anio_lectivo (id) ON DELETE CASCADE,
  CONSTRAINT fk_dash_periodo FOREIGN KEY (periodo_id) REFERENCES periodo_academico (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE configuracion_sistema (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  clave           VARCHAR(80)     NOT NULL,
  valor           TEXT            NOT NULL,
  updated_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_config_clave (clave)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- Total: 51 tablas
