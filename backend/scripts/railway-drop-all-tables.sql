-- Reset seguro para MySQL Railway cuando la migración init falló (P3009) y NO hay datos importantes.
-- Ejecutar conectado a la base del servicio MySQL de Railway.

SET FOREIGN_KEY_CHECKS = 0;

SET @schema = DATABASE();
SET @drop = NULL;

SELECT GROUP_CONCAT(CONCAT('`', table_name, '`') SEPARATOR ', ')
INTO @drop
FROM information_schema.tables
WHERE table_schema = @schema;

SET @sql = IF(@drop IS NULL, 'SELECT 1', CONCAT('DROP TABLE IF EXISTS ', @drop));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Todas las tablas eliminadas. Ejecute: npx prisma migrate deploy' AS next_step;
