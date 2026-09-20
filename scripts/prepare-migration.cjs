const fs = require('node:fs');
const cp = require('node:child_process');
fs.writeFileSync('.tmp/schema-before.prisma', cp.execFileSync('git', ['show','HEAD:tesis-dashboard/backend/prisma/schema.prisma'], {encoding:'utf8'}));
fs.mkdirSync('backend/prisma/migrations/20260919000000_blenkir_2026', {recursive:true});
