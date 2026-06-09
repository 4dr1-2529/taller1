/**
 * Imprime hash bcrypt para importación SQL legacy (variable @demo_bcrypt_hash).
 * Uso: DEMO_PASSWORD=<contraseña-demo> npm run db:demo-bcrypt
 */
import bcrypt from "bcryptjs";

const password = process.env.DEMO_PASSWORD?.trim();
if (!password) {
  console.error("Defina DEMO_PASSWORD con la contraseña demo del entorno local.");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
process.stdout.write(hash);
