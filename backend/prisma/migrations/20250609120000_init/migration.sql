-- CreateTable
CREATE TABLE `institucion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `ruc` VARCHAR(11) NULL,
    `direccion` VARCHAR(255) NULL,
    `ubigeo` VARCHAR(6) NULL,
    `telefono` VARCHAR(20) NULL,
    `email` VARCHAR(120) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_institucion_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anio_lectivo` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `institucion_id` BIGINT NOT NULL,
    `anio` SMALLINT NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `fecha_inicio` DATE NOT NULL,
    `fecha_fin` DATE NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_anio_inst`(`institucion_id`, `anio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodo_academico` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `anio_lectivo_id` BIGINT NOT NULL,
    `numero` TINYINT NOT NULL,
    `nombre` VARCHAR(40) NOT NULL,
    `fecha_inicio` DATE NOT NULL,
    `fecha_fin` DATE NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `uk_periodo_anio`(`anio_lectivo_id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nivel_educativo` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `uk_nivel_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grado` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nivel_id` BIGINT NOT NULL,
    `numero` TINYINT NOT NULL,
    `nombre` VARCHAR(60) NOT NULL,

    INDEX `idx_grado_nivel`(`nivel_id`),
    UNIQUE INDEX `uk_grado_nivel_num`(`nivel_id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seccion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `grado_id` BIGINT NOT NULL,
    `nombre` CHAR(1) NOT NULL,
    `capacidad` SMALLINT NOT NULL DEFAULT 30,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_seccion_grado`(`grado_id`),
    UNIQUE INDEX `uk_seccion_grado_nombre`(`grado_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `area_curricular` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `uk_area_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `curso_catalogo` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `area_id` BIGINT NOT NULL,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `horas_semanales` TINYINT NOT NULL DEFAULT 2,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    INDEX `idx_curso_area`(`area_id`),
    UNIQUE INDEX `uk_curso_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `curso_grado` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `grado_id` BIGINT NOT NULL,
    `curso_id` BIGINT NOT NULL,
    `obligatorio` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `uk_curso_grado`(`grado_id`, `curso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rol` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `codigo` ENUM('admin', 'docente', 'estudiante') NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NULL,

    UNIQUE INDEX `uk_rol_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permiso` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(60) NOT NULL,
    `modulo` VARCHAR(40) NOT NULL,
    `descripcion` VARCHAR(255) NULL,

    UNIQUE INDEX `uk_permiso_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rol_permiso` (
    `rol_id` BIGINT NOT NULL,
    `permiso_id` BIGINT NOT NULL,

    PRIMARY KEY (`rol_id`, `permiso_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `rol_id` BIGINT NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nombres` VARCHAR(80) NOT NULL,
    `apellidos` VARCHAR(80) NOT NULL,
    `dni` VARCHAR(8) NULL,
    `telefono` VARCHAR(20) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `ultimo_acceso` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_usuario_rol`(`rol_id`),
    INDEX `idx_usuario_activo`(`activo`),
    UNIQUE INDEX `uk_usuario_email`(`email`),
    UNIQUE INDEX `uk_usuario_dni`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sesion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT NOT NULL,
    `token_hash` VARCHAR(128) NOT NULL,
    `refresh_hash` VARCHAR(128) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `refresh_expires` DATETIME(3) NULL,
    `revocada` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_sesion_usuario`(`usuario_id`),
    INDEX `idx_sesion_expira`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `intento_login` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(120) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `exitoso` BOOLEAN NOT NULL DEFAULT false,
    `motivo` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_intento_email_fecha`(`email`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profesor` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT NULL,
    `codigo` VARCHAR(20) NOT NULL,
    `nombres` VARCHAR(80) NOT NULL,
    `apellidos` VARCHAR(80) NOT NULL,
    `especialidad` VARCHAR(80) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `profesor_usuario_id_key`(`usuario_id`),
    INDEX `idx_profesor_activo`(`activo`),
    UNIQUE INDEX `uk_profesor_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estudiante` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT NULL,
    `codigo` VARCHAR(20) NOT NULL,
    `nombres` VARCHAR(80) NOT NULL,
    `apellidos` VARCHAR(80) NOT NULL,
    `dni` VARCHAR(8) NULL,
    `email` VARCHAR(120) NULL,
    `telefono` VARCHAR(20) NULL,
    `seccion_id` BIGINT NULL,
    `estado` ENUM('activo', 'en_riesgo', 'retirado') NOT NULL DEFAULT 'activo',
    `promedio_general` DECIMAL(4, 2) NOT NULL DEFAULT 0,
    `asistencia_general` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fecha_ingreso` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `estudiante_usuario_id_key`(`usuario_id`),
    INDEX `idx_estudiante_seccion`(`seccion_id`),
    INDEX `idx_estudiante_estado`(`estado`, `activo`),
    UNIQUE INDEX `uk_estudiante_codigo`(`codigo`),
    UNIQUE INDEX `uk_estudiante_dni`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apoderado` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `dni` VARCHAR(8) NOT NULL,
    `nombres` VARCHAR(80) NOT NULL,
    `apellidos` VARCHAR(80) NOT NULL,
    `email` VARCHAR(120) NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_apoderado_dni`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estudiante_apoderado` (
    `estudiante_id` BIGINT NOT NULL,
    `apoderado_id` BIGINT NOT NULL,
    `parentesco` VARCHAR(30) NOT NULL DEFAULT 'apoderado',
    `es_principal` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`estudiante_id`, `apoderado_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tutor_seccion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `seccion_id` BIGINT NOT NULL,
    `profesor_id` BIGINT NOT NULL,
    `anio_lectivo_id` BIGINT NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `uk_tutor_seccion_anio`(`seccion_id`, `anio_lectivo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `curso_oferta` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `curso_id` BIGINT NOT NULL,
    `seccion_id` BIGINT NOT NULL,
    `profesor_id` BIGINT NOT NULL,
    `anio_lectivo_id` BIGINT NOT NULL,
    `codigo` VARCHAR(30) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_oferta_seccion`(`seccion_id`),
    INDEX `idx_oferta_profesor`(`profesor_id`),
    UNIQUE INDEX `uk_oferta_codigo`(`codigo`),
    UNIQUE INDEX `uk_oferta_curso_sec_anio`(`curso_id`, `seccion_id`, `anio_lectivo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matricula` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `seccion_id` BIGINT NOT NULL,
    `anio_lectivo_id` BIGINT NOT NULL,
    `codigo` VARCHAR(30) NOT NULL,
    `estado` ENUM('activa', 'retirada', 'trasladada') NOT NULL DEFAULT 'activa',
    `fecha_matricula` DATE NOT NULL,

    INDEX `idx_matricula_seccion`(`seccion_id`, `anio_lectivo_id`),
    UNIQUE INDEX `uk_matricula_codigo`(`codigo`),
    UNIQUE INDEX `uk_matricula_est_anio`(`estudiante_id`, `anio_lectivo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inscripcion_curso` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `curso_oferta_id` BIGINT NOT NULL,
    `estado` ENUM('activa', 'retirada') NOT NULL DEFAULT 'activa',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_insc_oferta`(`curso_oferta_id`),
    UNIQUE INDEX `uk_insc_est_oferta`(`estudiante_id`, `curso_oferta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `horario_clase` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `curso_oferta_id` BIGINT NOT NULL,
    `dia_semana` ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado') NOT NULL,
    `hora_inicio` TIME(0) NOT NULL,
    `hora_fin` TIME(0) NOT NULL,
    `aula` VARCHAR(20) NULL,

    INDEX `idx_horario_oferta`(`curso_oferta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calificacion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `curso_oferta_id` BIGINT NOT NULL,
    `periodo_id` BIGINT NOT NULL,
    `nota` DECIMAL(4, 2) NOT NULL,
    `observacion` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_calif_estudiante`(`estudiante_id`),
    UNIQUE INDEX `uk_calif`(`estudiante_id`, `curso_oferta_id`, `periodo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_academico` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `periodo_id` BIGINT NOT NULL,
    `promedio` DECIMAL(4, 2) NOT NULL,
    `cursos_desaprobados` TINYINT NOT NULL DEFAULT 0,
    `asistencia_pct` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `observacion` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_hist_est_periodo`(`estudiante_id`, `periodo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asistencia` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `fecha` DATE NOT NULL,
    `presente` BOOLEAN NOT NULL DEFAULT true,
    `tardanza` BOOLEAN NOT NULL DEFAULT false,
    `justificado` BOOLEAN NOT NULL DEFAULT false,
    `observacion` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_asistencia_fecha`(`fecha`),
    UNIQUE INDEX `uk_asistencia_est_fecha`(`estudiante_id`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resumen_asistencia` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `periodo_id` BIGINT NOT NULL,
    `dias_registrados` SMALLINT NOT NULL DEFAULT 0,
    `dias_presentes` SMALLINT NOT NULL DEFAULT 0,
    `porcentaje` DECIMAL(5, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `uk_res_asist_est_per`(`estudiante_id`, `periodo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lms_actividad_semanal` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `anio_semana` VARCHAR(8) NOT NULL,
    `actividad_pct` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `minutos` INTEGER NOT NULL DEFAULT 0,
    `horas_plataforma` DECIMAL(4, 1) NOT NULL DEFAULT 0,
    `conexiones` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_lms_act_est_sem`(`estudiante_id`, `anio_semana`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lms_entrega_tarea` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `curso_oferta_id` BIGINT NOT NULL,
    `periodo_id` BIGINT NOT NULL,
    `tareas_totales` SMALLINT NOT NULL DEFAULT 0,
    `tareas_entregadas` SMALLINT NOT NULL DEFAULT 0,
    `ratio` DECIMAL(4, 3) NOT NULL DEFAULT 0,

    UNIQUE INDEX `uk_lms_tarea`(`estudiante_id`, `curso_oferta_id`, `periodo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lms_indicador_estudiante` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `periodo_id` BIGINT NOT NULL,
    `frecuencia_acceso` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `tiempo_plataforma` DECIMAL(4, 1) NOT NULL DEFAULT 0,
    `tareas_ratio` DECIMAL(4, 3) NOT NULL DEFAULT 0,
    `participacion` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `uso_foros` DECIMAL(4, 3) NOT NULL DEFAULT 0,
    `disminucion_actividad` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_lms_ind_est_per`(`estudiante_id`, `periodo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ml_feature_def` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(40) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo_dato` VARCHAR(20) NOT NULL,
    `rango_min` DECIMAL(10, 4) NULL,
    `rango_max` DECIMAL(10, 4) NULL,
    `descripcion` VARCHAR(255) NULL,
    `orden` TINYINT NOT NULL,

    UNIQUE INDEX `uk_ml_feature_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ml_dataset` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(40) NOT NULL,
    `version` VARCHAR(20) NOT NULL,
    `ruta_archivo` VARCHAR(500) NULL,
    `hash_sha256` VARCHAR(64) NULL,
    `registros` INTEGER NOT NULL DEFAULT 0,
    `descripcion` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_ml_dataset_ver`(`codigo`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ml_entrenamiento` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `dataset_id` BIGINT NOT NULL,
    `codigo` VARCHAR(40) NOT NULL,
    `algoritmos` JSON NOT NULL,
    `hiperparametros` JSON NULL,
    `duracion_seg` INTEGER NULL,
    `estado` ENUM('pendiente', 'ejecutando', 'completado', 'fallido') NOT NULL DEFAULT 'pendiente',
    `iniciado_at` DATETIME(3) NULL,
    `finalizado_at` DATETIME(3) NULL,
    `log_texto` TEXT NULL,

    INDEX `idx_ml_train_dataset`(`dataset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ml_modelo` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `entrenamiento_id` BIGINT NOT NULL,
    `codigo` VARCHAR(40) NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `ruta_artifact` VARCHAR(500) NOT NULL,
    `version` VARCHAR(20) NOT NULL,
    `es_produccion` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_ml_modelo_prod`(`es_produccion`),
    UNIQUE INDEX `uk_ml_modelo_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ml_metrica` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `modelo_id` BIGINT NOT NULL,
    `accuracy` DECIMAL(6, 4) NULL,
    `precision_macro` DECIMAL(6, 4) NULL,
    `recall_macro` DECIMAL(6, 4) NULL,
    `f1_macro` DECIMAL(6, 4) NULL,
    `matriz_confusion` JSON NULL,
    `metricas_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_ml_metrica_modelo`(`modelo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prediccion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `modelo_id` BIGINT NULL,
    `score` DECIMAL(5, 2) NOT NULL,
    `nivel_riesgo` ENUM('bajo', 'medio', 'alto') NOT NULL,
    `probabilidad` DECIMAL(6, 4) NOT NULL,
    `probabilidad_abandono` DECIMAL(6, 4) NOT NULL,
    `periodo_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_pred_est_fecha`(`estudiante_id`, `created_at`),
    INDEX `idx_pred_nivel`(`nivel_riesgo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prediccion_feature_snapshot` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `prediccion_id` BIGINT NOT NULL,
    `feature_codigo` VARCHAR(40) NOT NULL,
    `valor_numerico` DECIMAL(12, 4) NULL,
    `valor_texto` VARCHAR(50) NULL,

    INDEX `idx_pfs_prediccion`(`prediccion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prediccion_factor` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `prediccion_id` BIGINT NOT NULL,
    `factor_key` VARCHAR(40) NOT NULL,
    `etiqueta` VARCHAR(120) NOT NULL,
    `contribucion` DECIMAL(6, 2) NOT NULL DEFAULT 0,

    INDEX `idx_pf_prediccion`(`prediccion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recomendacion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `prediccion_id` BIGINT NULL,
    `factor_key` VARCHAR(40) NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `detalle` TEXT NOT NULL,
    `aplicada` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_rec_estudiante`(`estudiante_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alerta` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `prediccion_id` BIGINT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `nivel_riesgo` ENUM('bajo', 'medio', 'alto') NOT NULL,
    `score` DECIMAL(5, 2) NULL,
    `probabilidad` DECIMAL(6, 4) NULL,
    `estado` ENUM('nueva', 'en_seguimiento', 'resuelta') NOT NULL DEFAULT 'nueva',
    `recomendacion` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_alerta_estado`(`estado`, `nivel_riesgo`),
    INDEX `idx_alerta_estudiante`(`estudiante_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alerta_historial` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `alerta_id` BIGINT NOT NULL,
    `estado_anterior` ENUM('nueva', 'en_seguimiento', 'resuelta') NULL,
    `estado_nuevo` ENUM('nueva', 'en_seguimiento', 'resuelta') NOT NULL,
    `usuario_id` BIGINT NULL,
    `comentario` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_ah_alerta`(`alerta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alerta_factor` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `alerta_id` BIGINT NOT NULL,
    `factor_key` VARCHAR(40) NOT NULL,
    `etiqueta` VARCHAR(120) NOT NULL,
    `contribucion` DECIMAL(6, 2) NOT NULL DEFAULT 0,

    INDEX `idx_af_alerta`(`alerta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensaje_sala` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` VARCHAR(60) NOT NULL,
    `alcance` ENUM('global', 'profesores', 'curso', 'directo') NOT NULL,
    `titulo` VARCHAR(150) NULL,
    `curso_oferta_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_ms_curso`(`curso_oferta_id`),
    UNIQUE INDEX `uk_mensaje_sala_room`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensaje` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sala_id` BIGINT NOT NULL,
    `remitente_id` BIGINT NOT NULL,
    `destinatario_id` BIGINT NULL,
    `contenido` TEXT NOT NULL,
    `mensaje_padre_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_mensaje_sala_fecha`(`sala_id`, `created_at`),
    INDEX `idx_mensaje_dest`(`destinatario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensaje_lectura` (
    `mensaje_id` BIGINT NOT NULL,
    `usuario_id` BIGINT NOT NULL,
    `leido` BOOLEAN NOT NULL DEFAULT false,
    `leido_at` DATETIME(3) NULL,

    INDEX `idx_ml_usuario`(`usuario_id`, `leido`),
    PRIMARY KEY (`mensaje_id`, `usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `entidad` VARCHAR(60) NOT NULL,
    `entidad_id` VARCHAR(40) NULL,
    `accion` VARCHAR(40) NOT NULL,
    `usuario_id` BIGINT NULL,
    `estudiante_id` BIGINT NULL,
    `profesor_id` BIGINT NULL,
    `detalle` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_audit_entidad`(`entidad`, `created_at`),
    INDEX `idx_audit_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(150) NOT NULL,
    `tipo` VARCHAR(40) NOT NULL,
    `generado_por` BIGINT NULL,
    `ruta_archivo` VARCHAR(500) NULL,
    `meta_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_reporte_tipo`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT NOT NULL,
    `tipo` ENUM('alerta', 'prediccion', 'sistema', 'reporte') NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `mensaje` TEXT NOT NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_notif_usuario`(`usuario_id`, `leida`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboard_snapshot` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `anio_lectivo_id` BIGINT NOT NULL,
    `periodo_id` BIGINT NULL,
    `total_estudiantes` INTEGER NOT NULL DEFAULT 0,
    `riesgo_bajo` INTEGER NOT NULL DEFAULT 0,
    `riesgo_medio` INTEGER NOT NULL DEFAULT 0,
    `riesgo_alto` INTEGER NOT NULL DEFAULT 0,
    `alertas_abiertas` INTEGER NOT NULL DEFAULT 0,
    `meta_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_dash_anio`(`anio_lectivo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion_sistema` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(80) NOT NULL,
    `valor` TEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_config_clave`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `anio_lectivo` ADD CONSTRAINT `anio_lectivo_institucion_id_fkey` FOREIGN KEY (`institucion_id`) REFERENCES `institucion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periodo_academico` ADD CONSTRAINT `periodo_academico_anio_lectivo_id_fkey` FOREIGN KEY (`anio_lectivo_id`) REFERENCES `anio_lectivo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grado` ADD CONSTRAINT `grado_nivel_id_fkey` FOREIGN KEY (`nivel_id`) REFERENCES `nivel_educativo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seccion` ADD CONSTRAINT `seccion_grado_id_fkey` FOREIGN KEY (`grado_id`) REFERENCES `grado`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `curso_catalogo` ADD CONSTRAINT `curso_catalogo_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `area_curricular`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `curso_grado` ADD CONSTRAINT `curso_grado_grado_id_fkey` FOREIGN KEY (`grado_id`) REFERENCES `grado`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `curso_grado` ADD CONSTRAINT `curso_grado_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `curso_catalogo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_permiso` ADD CONSTRAINT `rol_permiso_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `rol`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_permiso` ADD CONSTRAINT `rol_permiso_permiso_id_fkey` FOREIGN KEY (`permiso_id`) REFERENCES `permiso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sesion` ADD CONSTRAINT `sesion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profesor` ADD CONSTRAINT `profesor_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estudiante` ADD CONSTRAINT `estudiante_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estudiante` ADD CONSTRAINT `estudiante_seccion_id_fkey` FOREIGN KEY (`seccion_id`) REFERENCES `seccion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estudiante_apoderado` ADD CONSTRAINT `estudiante_apoderado_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estudiante_apoderado` ADD CONSTRAINT `estudiante_apoderado_apoderado_id_fkey` FOREIGN KEY (`apoderado_id`) REFERENCES `apoderado`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tutor_seccion` ADD CONSTRAINT `tutor_seccion_seccion_id_fkey` FOREIGN KEY (`seccion_id`) REFERENCES `seccion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tutor_seccion` ADD CONSTRAINT `tutor_seccion_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tutor_seccion` ADD CONSTRAINT `tutor_seccion_anio_lectivo_id_fkey` FOREIGN KEY (`anio_lectivo_id`) REFERENCES `anio_lectivo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `curso_oferta` ADD CONSTRAINT `curso_oferta_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `curso_catalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `curso_oferta` ADD CONSTRAINT `curso_oferta_seccion_id_fkey` FOREIGN KEY (`seccion_id`) REFERENCES `seccion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `curso_oferta` ADD CONSTRAINT `curso_oferta_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `curso_oferta` ADD CONSTRAINT `curso_oferta_anio_lectivo_id_fkey` FOREIGN KEY (`anio_lectivo_id`) REFERENCES `anio_lectivo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matricula` ADD CONSTRAINT `matricula_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matricula` ADD CONSTRAINT `matricula_seccion_id_fkey` FOREIGN KEY (`seccion_id`) REFERENCES `seccion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matricula` ADD CONSTRAINT `matricula_anio_lectivo_id_fkey` FOREIGN KEY (`anio_lectivo_id`) REFERENCES `anio_lectivo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscripcion_curso` ADD CONSTRAINT `inscripcion_curso_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscripcion_curso` ADD CONSTRAINT `inscripcion_curso_curso_oferta_id_fkey` FOREIGN KEY (`curso_oferta_id`) REFERENCES `curso_oferta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horario_clase` ADD CONSTRAINT `horario_clase_curso_oferta_id_fkey` FOREIGN KEY (`curso_oferta_id`) REFERENCES `curso_oferta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calificacion` ADD CONSTRAINT `calificacion_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calificacion` ADD CONSTRAINT `calificacion_curso_oferta_id_fkey` FOREIGN KEY (`curso_oferta_id`) REFERENCES `curso_oferta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calificacion` ADD CONSTRAINT `calificacion_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodo_academico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_academico` ADD CONSTRAINT `historial_academico_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_academico` ADD CONSTRAINT `historial_academico_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodo_academico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asistencia` ADD CONSTRAINT `asistencia_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resumen_asistencia` ADD CONSTRAINT `resumen_asistencia_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resumen_asistencia` ADD CONSTRAINT `resumen_asistencia_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodo_academico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_actividad_semanal` ADD CONSTRAINT `lms_actividad_semanal_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_entrega_tarea` ADD CONSTRAINT `lms_entrega_tarea_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_entrega_tarea` ADD CONSTRAINT `lms_entrega_tarea_curso_oferta_id_fkey` FOREIGN KEY (`curso_oferta_id`) REFERENCES `curso_oferta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_entrega_tarea` ADD CONSTRAINT `lms_entrega_tarea_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodo_academico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_indicador_estudiante` ADD CONSTRAINT `lms_indicador_estudiante_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_indicador_estudiante` ADD CONSTRAINT `lms_indicador_estudiante_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodo_academico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ml_entrenamiento` ADD CONSTRAINT `ml_entrenamiento_dataset_id_fkey` FOREIGN KEY (`dataset_id`) REFERENCES `ml_dataset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ml_modelo` ADD CONSTRAINT `ml_modelo_entrenamiento_id_fkey` FOREIGN KEY (`entrenamiento_id`) REFERENCES `ml_entrenamiento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ml_metrica` ADD CONSTRAINT `ml_metrica_modelo_id_fkey` FOREIGN KEY (`modelo_id`) REFERENCES `ml_modelo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prediccion` ADD CONSTRAINT `prediccion_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prediccion` ADD CONSTRAINT `prediccion_modelo_id_fkey` FOREIGN KEY (`modelo_id`) REFERENCES `ml_modelo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prediccion` ADD CONSTRAINT `prediccion_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodo_academico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prediccion_feature_snapshot` ADD CONSTRAINT `prediccion_feature_snapshot_prediccion_id_fkey` FOREIGN KEY (`prediccion_id`) REFERENCES `prediccion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prediccion_factor` ADD CONSTRAINT `prediccion_factor_prediccion_id_fkey` FOREIGN KEY (`prediccion_id`) REFERENCES `prediccion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recomendacion` ADD CONSTRAINT `recomendacion_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recomendacion` ADD CONSTRAINT `recomendacion_prediccion_id_fkey` FOREIGN KEY (`prediccion_id`) REFERENCES `prediccion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerta` ADD CONSTRAINT `alerta_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerta` ADD CONSTRAINT `alerta_prediccion_id_fkey` FOREIGN KEY (`prediccion_id`) REFERENCES `prediccion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerta_historial` ADD CONSTRAINT `alerta_historial_alerta_id_fkey` FOREIGN KEY (`alerta_id`) REFERENCES `alerta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerta_historial` ADD CONSTRAINT `alerta_historial_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerta_factor` ADD CONSTRAINT `alerta_factor_alerta_id_fkey` FOREIGN KEY (`alerta_id`) REFERENCES `alerta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje_sala` ADD CONSTRAINT `mensaje_sala_curso_oferta_id_fkey` FOREIGN KEY (`curso_oferta_id`) REFERENCES `curso_oferta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje` ADD CONSTRAINT `mensaje_sala_id_fkey` FOREIGN KEY (`sala_id`) REFERENCES `mensaje_sala`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje` ADD CONSTRAINT `mensaje_remitente_id_fkey` FOREIGN KEY (`remitente_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje` ADD CONSTRAINT `mensaje_destinatario_id_fkey` FOREIGN KEY (`destinatario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje` ADD CONSTRAINT `mensaje_mensaje_padre_id_fkey` FOREIGN KEY (`mensaje_padre_id`) REFERENCES `mensaje`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje_lectura` ADD CONSTRAINT `mensaje_lectura_mensaje_id_fkey` FOREIGN KEY (`mensaje_id`) REFERENCES `mensaje`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje_lectura` ADD CONSTRAINT `mensaje_lectura_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte` ADD CONSTRAINT `reporte_generado_por_fkey` FOREIGN KEY (`generado_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacion` ADD CONSTRAINT `notificacion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_snapshot` ADD CONSTRAINT `dashboard_snapshot_anio_lectivo_id_fkey` FOREIGN KEY (`anio_lectivo_id`) REFERENCES `anio_lectivo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_snapshot` ADD CONSTRAINT `dashboard_snapshot_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodo_academico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

