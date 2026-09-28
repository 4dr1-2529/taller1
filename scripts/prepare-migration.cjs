const fs = require('node:fs');
const cp = require('node:child_process');

// Git se resuelve contra rutas absolutas fijas conocidas en lugar de depender de
// la resolución de PATH (CWE-426): si no está en ninguna de ellas, el script para.
const GIT_CANDIDATES = [
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
  '/usr/bin/git',
  '/usr/local/bin/git',
];
const gitBinary = GIT_CANDIDATES.find((candidate) => fs.existsSync(candidate));
if (!gitBinary) {
  throw new Error('No se encontró el binario de git en una ruta fija conocida');
}

fs.writeFileSync('.tmp/schema-before.prisma', cp.execFileSync(gitBinary, ['show', 'HEAD:tesis-dashboard/backend/prisma/schema.prisma'], { encoding: 'utf8' }));
fs.mkdirSync('backend/prisma/migrations/20260919000000_blenkir_2026', { recursive: true });
