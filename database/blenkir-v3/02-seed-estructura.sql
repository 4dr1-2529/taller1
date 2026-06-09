-- =============================================================================
-- I.E.P. BLENKIR — Datos semilla: estructura institucional
-- Ejecutar después de 01-schema.sql
-- =============================================================================

USE tesis_blenkir;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Hash bcrypt de contraseña demo (Tesis2026!) — entorno académico, no texto plano
SET @pwd := '$2a$12$JTmnq1jHDMOgBHOUH0o2ne0CpvWXJzaRahmeg2YVjb6HB.p.73686'; -- nosonar

-- ─── Institución y calendario ───────────────────────────────────────────────

INSERT INTO institucion (codigo, nombre, ruc, direccion, ubigeo, telefono, email) VALUES
('BLENKIR', 'Institución Educativa Privada Blenkir', '20123456789', 'Av. Huancayo 450, El Tambo', '120101', '064-123456', 'info@blenkir.edu.pe');

SET @inst := LAST_INSERT_ID();

INSERT INTO anio_lectivo (institucion_id, anio, nombre, fecha_inicio, fecha_fin, activo) VALUES
(@inst, 2026, 'Año Lectivo 2026', '2026-03-01', '2026-12-15', 1);

SET @anio := LAST_INSERT_ID();

INSERT INTO periodo_academico (anio_lectivo_id, numero, nombre, fecha_inicio, fecha_fin, activo) VALUES
(@anio, 1, 'I Bimestre', '2026-03-01', '2026-04-30', 1),
(@anio, 2, 'II Bimestre', '2026-05-01', '2026-06-30', 0),
(@anio, 3, 'III Bimestre', '2026-07-01', '2026-08-31', 0),
(@anio, 4, 'IV Bimestre', '2026-09-01', '2026-12-15', 0);

SET @periodo1 := (SELECT id FROM periodo_academico WHERE anio_lectivo_id = @anio AND numero = 1);

-- ─── Nivel y grados ─────────────────────────────────────────────────────────

INSERT INTO nivel_educativo (codigo, nombre) VALUES ('primaria', 'Educación Primaria');

SET @nivel := LAST_INSERT_ID();

INSERT INTO grado (nivel_id, numero, nombre) VALUES
(@nivel, 1, '1° Primaria'),
(@nivel, 2, '2° Primaria'),
(@nivel, 3, '3° Primaria'),
(@nivel, 4, '4° Primaria'),
(@nivel, 5, '5° Primaria'),
(@nivel, 6, '6° Primaria');

-- ─── Secciones (22 total) ───────────────────────────────────────────────────

INSERT INTO seccion (grado_id, nombre, capacidad)
SELECT g.id, s.nombre, 30
FROM grado g
JOIN (
  SELECT 1 AS num, 'A' AS nombre UNION SELECT 1,'B' UNION SELECT 1,'C' UNION SELECT 1,'D'
  UNION SELECT 2,'A' UNION SELECT 2,'B' UNION SELECT 2,'C' UNION SELECT 2,'D'
  UNION SELECT 3,'A' UNION SELECT 3,'B' UNION SELECT 3,'C' UNION SELECT 3,'D'
  UNION SELECT 4,'A' UNION SELECT 4,'B' UNION SELECT 4,'C' UNION SELECT 4,'D'
  UNION SELECT 5,'A' UNION SELECT 5,'B' UNION SELECT 5,'C'
  UNION SELECT 6,'A' UNION SELECT 6,'B' UNION SELECT 6,'C'
) s ON g.numero = s.num;

-- ─── Áreas y catálogo (16 cursos) ───────────────────────────────────────────

INSERT INTO area_curricular (codigo, nombre) VALUES
('MAT', 'Matemática'),
('COM', 'Comunicación'),
('CIE', 'Ciencia y Tecnología'),
('SOC', 'Ciencias Sociales'),
('REL', 'Religión'),
('IDI', 'Idiomas'),
('TAL', 'Arte y Taller'),
('EDF', 'Educación Física');

INSERT INTO curso_catalogo (area_id, codigo, nombre, horas_semanales) VALUES
((SELECT id FROM area_curricular WHERE codigo='MAT'), 'ARI', 'Aritmética', 5),
((SELECT id FROM area_curricular WHERE codigo='MAT'), 'ALG', 'Álgebra', 3),
((SELECT id FROM area_curricular WHERE codigo='MAT'), 'RZM', 'Razonamiento Matemático', 2),
((SELECT id FROM area_curricular WHERE codigo='MAT'), 'GEO', 'Geometría', 2),
((SELECT id FROM area_curricular WHERE codigo='COM'), 'PDT', 'Producción de Textos', 3),
((SELECT id FROM area_curricular WHERE codigo='COM'), 'GRA', 'Gramática', 3),
((SELECT id FROM area_curricular WHERE codigo='COM'), 'RZV', 'Razonamiento Verbal', 2),
((SELECT id FROM area_curricular WHERE codigo='CIE'), 'CUH', 'Cuerpo Humano', 2),
((SELECT id FROM area_curricular WHERE codigo='CIE'), 'MUF', 'Mundo Físico', 2),
((SELECT id FROM area_curricular WHERE codigo='SOC'), 'CIU', 'Ciudadanía', 2),
((SELECT id FROM area_curricular WHERE codigo='SOC'), 'GEG', 'Geografía', 2),
((SELECT id FROM area_curricular WHERE codigo='SOC'), 'HIS', 'Historia', 2),
((SELECT id FROM area_curricular WHERE codigo='REL'), 'REL', 'Religión', 1),
((SELECT id FROM area_curricular WHERE codigo='IDI'), 'ING', 'Inglés', 2),
((SELECT id FROM area_curricular WHERE codigo='TAL'), 'TAL', 'Taller', 2),
((SELECT id FROM area_curricular WHERE codigo='EDF'), 'EDF', 'Educación Física', 2);

-- Curso por grado: 1°-2° sin ALG, RZM, GEO; 3°-6° los 16 cursos
INSERT INTO curso_grado (grado_id, curso_id, obligatorio)
SELECT g.id, c.id, 1
FROM grado g
CROSS JOIN curso_catalogo c
WHERE (g.numero <= 2 AND c.codigo NOT IN ('ALG','RZM','GEO'))
   OR (g.numero >= 3);

-- ─── RBAC ───────────────────────────────────────────────────────────────────

INSERT INTO rol (codigo, nombre, descripcion) VALUES
('admin', 'Director', 'Gestión institucional completa'),
('docente', 'Profesor', 'Gestión de cursos y estudiantes asignados'),
('estudiante', 'Estudiante', 'Consulta de información propia');

INSERT INTO permiso (codigo, modulo, descripcion) VALUES
('admin.full', 'admin', 'Acceso total'),
('estudiantes.read', 'estudiantes', 'Ver estudiantes'),
('estudiantes.write', 'estudiantes', 'Gestionar estudiantes'),
('notas.write', 'academico', 'Registrar notas'),
('asistencia.write', 'asistencia', 'Registrar asistencia'),
('alertas.manage', 'alertas', 'Gestionar alertas'),
('ia.predict', 'ia', 'Ejecutar predicciones'),
('reportes.export', 'reportes', 'Exportar reportes'),
('mensajes.send', 'mensajeria', 'Enviar mensajes');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r CROSS JOIN permiso p WHERE r.codigo = 'admin';

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.codigo = 'docente' AND p.codigo IN ('estudiantes.read','notas.write','asistencia.write','alertas.manage','ia.predict','reportes.export','mensajes.send');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.codigo = 'estudiante' AND p.codigo IN ('estudiantes.read','mensajes.send');

-- ─── Director ───────────────────────────────────────────────────────────────

INSERT INTO usuario (rol_id, email, password_hash, nombres, apellidos, dni, activo)
SELECT id, 'director@blenkir.edu.pe', @pwd, 'Carlos', 'Ramírez Vargas', '12345678', 1
FROM rol WHERE codigo = 'admin';

-- ─── 15 Profesores ──────────────────────────────────────────────────────────

INSERT INTO usuario (rol_id, email, password_hash, nombres, apellidos, activo)
SELECT (SELECT id FROM rol WHERE codigo='docente'), CONCAT('profesor', n, '@blenkir.edu.pe'), @pwd,
  ELT(n, 'María','José','Ana','Luis','Rosa','Pedro','Lucía','Jorge','Carmen','Miguel','Patricia','Ricardo','Elena','Fernando','Gabriela'),
  ELT(n, 'Quispe','Flores','García','Torres','Mamani','Rojas','Díaz','Chávez','Vega','Castro','Silva','Herrera','Morales','Paredes','Salazar'),
  1
FROM (
  SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
  UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
  UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
) nums;

INSERT INTO profesor (usuario_id, codigo, nombres, apellidos, especialidad, email)
SELECT u.id, CONCAT('DOC-', LPAD(ROW_NUMBER() OVER (ORDER BY u.id), 3, '0')),
  u.nombres, u.apellidos,
  ELT(ROW_NUMBER() OVER (ORDER BY u.id), 'Aritmética','Comunicación','Ciencias','Sociales','Inglés','Educación Física','Matemática','Lenguaje','Religión','Taller','Geografía','Historia','Razonamiento','Geometría','Álgebra'),
  u.email
FROM usuario u
JOIN rol r ON u.rol_id = r.id
WHERE r.codigo = 'docente';

-- Tutores de sección (rotación profesores 1-22)
INSERT INTO tutor_seccion (seccion_id, profesor_id, anio_lectivo_id, activo)
SELECT s.id, p.id, @anio, 1
FROM (
  SELECT s.id, ROW_NUMBER() OVER (ORDER BY g.numero, s.nombre) AS rn
  FROM seccion s JOIN grado g ON s.grado_id = g.id
) s
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM profesor
) p ON ((s.rn - 1) MOD 15) + 1 = p.rn;

-- ─── Oferta curricular (curso × sección × profesor) ─────────────────────────

INSERT INTO curso_oferta (curso_id, seccion_id, profesor_id, anio_lectivo_id, codigo, activo)
SELECT c.id, sec.id,
  (SELECT id FROM profesor ORDER BY id LIMIT 1 OFFSET ((c.id + sec.id) MOD 15)),
  @anio,
  CONCAT(c.codigo, '-', g.numero, sec.nombre, '-2026'),
  1
FROM seccion sec
JOIN grado g ON sec.grado_id = g.id
JOIN curso_grado cg ON cg.grado_id = g.id
JOIN curso_catalogo c ON c.id = cg.curso_id;

-- ─── ML: definición de features ─────────────────────────────────────────────

INSERT INTO ml_feature_def (codigo, nombre, tipo_dato, rango_min, rango_max, descripcion, orden) VALUES
('promedio_general', 'Promedio general', 'decimal', 0, 20, 'Promedio académico consolidado', 1),
('cursos_desaprobados', 'Cursos desaprobados', 'integer', 0, 16, 'Cursos con nota menor a 11', 2),
('asistencia_general', 'Asistencia general', 'decimal', 0, 100, 'Porcentaje de asistencia', 3),
('frecuencia_acceso_lms', 'Frecuencia acceso LMS', 'decimal', 0, 100, 'Actividad semanal en plataforma', 4),
('tiempo_plataforma', 'Tiempo en plataforma', 'decimal', 0, 24, 'Horas semanales en LMS', 5),
('tareas_ratio', 'Ratio de tareas', 'decimal', 0, 1, 'Tareas entregadas / totales', 6),
('participacion_actividades', 'Participación', 'decimal', 0, 100, 'Participación en actividades LMS', 7),
('uso_foros', 'Uso de foros', 'decimal', 0, 1, 'Interacción en foros', 8),
('disminucion_actividad', 'Disminución actividad', 'decimal', 0, 100, 'Caída de actividad entre semanas', 9),
('estado', 'Estado estudiante', 'categorical', NULL, NULL, 'activo / en_riesgo / retirado', 10);

INSERT INTO ml_dataset (codigo, version, ruta_archivo, registros, descripcion) VALUES
('blenkir_primaria', '1.0.0', 'machine-learning/data/synthetic_blenkir.csv', 2500, 'Dataset sintético alineado a variables tesis');

INSERT INTO ml_entrenamiento (dataset_id, codigo, algoritmos, estado, iniciado_at, finalizado_at)
VALUES (
  LAST_INSERT_ID(), 'TRAIN-2026-001',
  JSON_ARRAY('random_forest','hist_gradient_boosting','stacking'),
  'completado', NOW(3), NOW(3)
);

SET @train := LAST_INSERT_ID();

INSERT INTO ml_modelo (entrenamiento_id, codigo, nombre, ruta_artifact, version, es_produccion) VALUES
(@train, 'RF-2026', 'Random Forest', 'machine-learning/models/best_model.joblib', '1.0.0', 1);

SET @modelo := LAST_INSERT_ID();

INSERT INTO ml_metrica (modelo_id, accuracy, precision_macro, recall_macro, f1_macro, matriz_confusion) VALUES
(@modelo, 0.9800, 0.9750, 0.9780, 1.0000, JSON_ARRAY(JSON_ARRAY(820,12,8), JSON_ARRAY(10,830,10), JSON_ARRAY(5,8,837)));

-- ─── Configuración ──────────────────────────────────────────────────────────

INSERT INTO configuracion_sistema (clave, valor) VALUES
('institucion.nombre', 'I.E.P. Blenkir'),
('ml.modelo_activo', 'RF-2026'),
('alertas.umbral_medio', '41'),
('alertas.umbral_alto', '65'),
('anio_lectivo_activo', '2026');

INSERT INTO dashboard_snapshot (anio_lectivo_id, periodo_id, total_estudiantes, riesgo_bajo, riesgo_medio, riesgo_alto, alertas_abiertas)
VALUES (@anio, @periodo1, 660, 0, 0, 0, 0);

INSERT INTO mensaje_sala (room_id, alcance, titulo) VALUES
('global-institucion', 'global', 'Comunicados I.E.P. Blenkir'),
('profesores-interno', 'profesores', 'Coordinación docente');

SET FOREIGN_KEY_CHECKS = 1;

-- Siguiente paso: node generate-poblacion.mjs > 03-seed-poblacion.sql
