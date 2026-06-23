-- Asignación docente: tutor (1°-2°) y polidocencia (3°-6°)

CREATE TABLE `asignacion_docente` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `profesor_id` BIGINT NOT NULL,
    `curso_id` BIGINT NOT NULL,
    `grado_id` BIGINT NOT NULL,
    `seccion_id` BIGINT NOT NULL,
    `anio_lectivo_id` BIGINT NOT NULL,
    `curso_oferta_id` BIGINT NULL,
    `es_tutor` BOOLEAN NOT NULL DEFAULT false,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_asig_prof_cur_sec_anio`(`profesor_id`, `curso_id`, `seccion_id`, `anio_lectivo_id`),
    UNIQUE INDEX `uk_asig_cur_sec_anio`(`curso_id`, `seccion_id`, `anio_lectivo_id`),
    INDEX `idx_asig_profesor`(`profesor_id`, `activo`),
    INDEX `idx_asig_seccion_anio`(`seccion_id`, `anio_lectivo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `asignacion_docente` ADD CONSTRAINT `asignacion_docente_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `asignacion_docente` ADD CONSTRAINT `asignacion_docente_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `curso_catalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `asignacion_docente` ADD CONSTRAINT `asignacion_docente_grado_id_fkey` FOREIGN KEY (`grado_id`) REFERENCES `grado`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `asignacion_docente` ADD CONSTRAINT `asignacion_docente_seccion_id_fkey` FOREIGN KEY (`seccion_id`) REFERENCES `seccion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `asignacion_docente` ADD CONSTRAINT `asignacion_docente_anio_lectivo_id_fkey` FOREIGN KEY (`anio_lectivo_id`) REFERENCES `anio_lectivo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `asignacion_docente` ADD CONSTRAINT `asignacion_docente_curso_oferta_id_fkey` FOREIGN KEY (`curso_oferta_id`) REFERENCES `curso_oferta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill desde ofertas de curso existentes
INSERT INTO `asignacion_docente` (
    `profesor_id`, `curso_id`, `grado_id`, `seccion_id`, `anio_lectivo_id`,
    `curso_oferta_id`, `es_tutor`, `activo`, `created_at`, `updated_at`
)
SELECT
    co.`profesor_id`,
    co.`curso_id`,
    s.`grado_id`,
    co.`seccion_id`,
    co.`anio_lectivo_id`,
    co.`id`,
    CASE WHEN g.`numero` <= 2 THEN true ELSE false END,
    co.`activo`,
    co.`created_at`,
    NOW(3)
FROM `curso_oferta` co
INNER JOIN `seccion` s ON s.`id` = co.`seccion_id`
INNER JOIN `grado` g ON g.`id` = s.`grado_id`
WHERE co.`activo` = true
ON DUPLICATE KEY UPDATE
    `curso_oferta_id` = VALUES(`curso_oferta_id`),
    `es_tutor` = VALUES(`es_tutor`),
    `activo` = VALUES(`activo`),
    `updated_at` = NOW(3);
