/**
 * Migra respuestas { ok: true, ... } → sendSuccess / sendCreated con objeto data.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, "..", "src");

const FILES = [
  "index.ts",
  "routes/index.ts",
  ...fs
    .readdirSync(path.join(srcRoot, "controllers"))
    .filter((f) => f.endsWith(".ts"))
    .map((f) => `controllers/${f}`),
];

function extractBalanced(source, startIdx) {
  if (source[startIdx] !== "{") throw new Error("expected {");
  let depth = 0;
  for (let i = startIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return source.slice(startIdx, i + 1);
    }
  }
  throw new Error("unbalanced braces");
}

function migrateContent(content, importLine) {
  let result = content;
  const patterns = [
    { re: /res\.status\(201\)\.json\(/g, fn: "sendCreated" },
    { re: /res\.json\(/g, fn: "sendSuccess" },
  ];

  for (const { re, fn } of patterns) {
    let m;
    const replacements = [];
    const regex = new RegExp(re.source, re.flags);
    while ((m = regex.exec(result)) !== null) {
      const openBrace = result.indexOf("{", m.index + m[0].length);
      if (openBrace === -1) continue;
      const objStr = extractBalanced(result, openBrace);
      const inner = objStr.slice(1, -1).trim();
      if (!/^ok:\s*true/.test(inner)) continue;

      const afterOk = inner.replace(/^ok:\s*true,?\s*/, "").trim();
      let replacement;
      if (!afterOk) {
        replacement = `${fn}(res, {})`;
      } else if (/^message:\s*/.test(afterOk) && !afterOk.includes(",")) {
        const msg = afterOk.replace(/^message:\s*/, "");
        replacement = `${fn}(res, {}, ${msg})`;
      } else {
        replacement = `${fn}(res, { ${afterOk} })`;
      }
      replacements.push({ start: m.index, end: openBrace + objStr.length, replacement });
    }
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { start, end, replacement } = replacements[i];
      const closeParen = result[end] === ")" ? end + 1 : end;
      result = result.slice(0, start) + replacement + result.slice(closeParen);
    }
  }

  if (!result.includes("sendSuccess") && !result.includes("sendCreated")) return content;
  if (result.includes('from "../utils/response.js"') || result.includes('from "./utils/response.js"')) {
    return result;
  }
  const idx = result.indexOf("\n\n");
  return idx === -1 ? importLine + result : result.slice(0, idx + 1) + importLine + result.slice(idx + 1);
}

for (const rel of FILES) {
  const fp = path.join(srcRoot, rel);
  const content = fs.readFileSync(fp, "utf8");
  const importLine =
    rel === "index.ts"
      ? 'import { sendSuccess } from "./utils/response.js";\n'
      : 'import { sendCreated, sendSuccess } from "../utils/response.js";\n';
  const next = migrateContent(content, importLine);
  if (next !== content) {
    fs.writeFileSync(fp, next);
    console.log("updated", rel);
  }
}
