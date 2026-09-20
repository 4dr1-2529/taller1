-- Administrative state is independent from predictive risk. Predictions remain untouched.
UPDATE estudiante SET estado = 'activo' WHERE estado = 'en_riesgo';
ALTER TABLE estudiante MODIFY estado ENUM('activo','retirado') NOT NULL DEFAULT 'activo';
ALTER TABLE prediccion ADD COLUMN model_name VARCHAR(80) NULL,
 ADD COLUMN contract_version VARCHAR(20) NULL,
 ADD COLUMN input_data JSON NULL,
 ADD COLUMN recommendation TEXT NULL;
