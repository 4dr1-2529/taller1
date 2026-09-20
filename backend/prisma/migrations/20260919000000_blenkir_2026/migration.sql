-- AlterTable
ALTER TABLE `profesor` ADD COLUMN `dni` VARCHAR(8) NULL;

-- CreateTable
CREATE TABLE `correlativo` (
    `entidad` VARCHAR(30) NOT NULL,
    `prefijo` VARCHAR(20) NOT NULL,
    `ultimo_numero` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`entidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_educativo` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `tipo` ENUM('pdf', 'documento', 'presentacion', 'enlace', 'guia', 'repaso') NOT NULL,
    `url` VARCHAR(1000) NOT NULL,
    `profesor_id` BIGINT NOT NULL,
    `curso_id` BIGINT NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `material_educativo_curso_id_activo_idx`(`curso_id`, `activo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividad_academica` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `tipo` ENUM('practica', 'lectura', 'repaso', 'material_obligatorio', 'otra') NOT NULL,
    `profesor_id` BIGINT NOT NULL,
    `curso_id` BIGINT NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `actividad_academica_curso_id_activo_idx`(`curso_id`, `activo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividad_progreso` (
    `estudiante_id` BIGINT NOT NULL,
    `actividad_id` BIGINT NOT NULL,
    `estado` ENUM('pendiente', 'iniciada', 'completada') NOT NULL DEFAULT 'pendiente',
    `iniciada_at` DATETIME(3) NULL,
    `completada_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`estudiante_id`, `actividad_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lms_evento` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `estudiante_id` BIGINT NOT NULL,
    `tipo` ENUM('login', 'logout', 'sesion', 'recurso', 'actividad', 'curso') NOT NULL,
    `curso_id` BIGINT NULL,
    `material_id` BIGINT NULL,
    `actividad_id` BIGINT NULL,
    `duracion_segundos` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lms_evento_estudiante_id_created_at_idx`(`estudiante_id`, `created_at`),
    INDEX `lms_evento_curso_id_created_at_idx`(`curso_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `profesor_dni_key` ON `profesor`(`dni`);

-- AddForeignKey
ALTER TABLE `material_educativo` ADD CONSTRAINT `material_educativo_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_educativo` ADD CONSTRAINT `material_educativo_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `curso_oferta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividad_academica` ADD CONSTRAINT `actividad_academica_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividad_academica` ADD CONSTRAINT `actividad_academica_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `curso_oferta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividad_progreso` ADD CONSTRAINT `actividad_progreso_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividad_progreso` ADD CONSTRAINT `actividad_progreso_actividad_id_fkey` FOREIGN KEY (`actividad_id`) REFERENCES `actividad_academica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_evento` ADD CONSTRAINT `lms_evento_estudiante_id_fkey` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_evento` ADD CONSTRAINT `lms_evento_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `curso_oferta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_evento` ADD CONSTRAINT `lms_evento_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `material_educativo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_evento` ADD CONSTRAINT `lms_evento_actividad_id_fkey` FOREIGN KEY (`actividad_id`) REFERENCES `actividad_academica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
