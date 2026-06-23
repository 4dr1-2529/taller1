-- Unificar contraseña institucional: mbappe29 (bcrypt cost 12)
UPDATE `usuario`
SET `password_hash` = '$2a$12$73ROJQsPCkj3SvgwzKoRPOAYNKbvdylJefeUsqvNWtL09VM5O07xG',
    `updated_at` = CURRENT_TIMESTAMP(3);
