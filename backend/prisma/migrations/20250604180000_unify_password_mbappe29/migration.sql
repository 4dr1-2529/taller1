-- Unificar password_hash institucional (bcrypt cost 12). Valor plano: variable DEMO_PASSWORD al sembrar.
UPDATE `usuario`
SET `password_hash` = '$2a$12$73ROJQsPCkj3SvgwzKoRPOAYNKbvdylJefeUsqvNWtL09VM5O07xG',
    `updated_at` = CURRENT_TIMESTAMP(3);