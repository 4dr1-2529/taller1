import fs from "node:fs";

const schema = fs.readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const count = [...schema.matchAll(/^model\s+\w+\s*\{/gm)].length;
console.log(`Modelos Prisma: ${count}`);