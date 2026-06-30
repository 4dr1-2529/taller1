-- Las contraseñas institucionales se aplican vía seed/repair (DEMO_PASSWORD en entorno).
-- No almacenar hashes bcrypt en SQL: ver backend/scripts/update-all-passwords.mjs
SELECT 1 AS password_policy_marker;
