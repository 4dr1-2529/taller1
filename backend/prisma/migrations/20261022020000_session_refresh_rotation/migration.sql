-- SPRINT 5 — Rotacion segura de refresh tokens.
-- `refresh_rotated_at`: instante de la ultima rotacion; habilita la ventana de
-- gracia que distingue una renovacion concurrente legitima (multiples pestanas
-- o procesos con el mismo token) de una reutilizacion sostenida (posible robo).
-- Columna nullable: no afecta a sesiones existentes ni requiere backfill.
ALTER TABLE `sesion` ADD COLUMN `refresh_rotated_at` DATETIME(3) NULL;
