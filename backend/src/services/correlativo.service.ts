import type { Prisma } from "@prisma/client";

export type CodeEntity = "estudiante" | "profesor" | "matricula";
const prefixes = { estudiante: "EST-", profesor: "PROF-", matricula: "MAT-2026-" };

/** The upsert takes a database row lock, held until the caller's transaction commits. */
export async function nextCode(tx: Prisma.TransactionClient, entidad: CodeEntity): Promise<string> {
  const prefijo = prefixes[entidad];
  await tx.correlativo.upsert({
    where: { entidad }, create: { entidad, prefijo, ultimoNumero: 0 },
    update: { prefijo },
  });
  // Bootstrap from every existing code, including inactive people. Never use row count.
  const rows = entidad === "estudiante"
    ? await tx.student.findMany({ select: { codigo: true } })
    : entidad === "profesor"
      ? await tx.teacher.findMany({ select: { codigo: true } })
      : await tx.matricula.findMany({ select: { codigo: true } });
  const maximum = rows.reduce((max, row) => {
    const suffix = row.codigo.startsWith(prefijo) ? row.codigo.slice(prefijo.length) : "";
    return /^\d+$/.test(suffix) ? Math.max(max, Number(suffix)) : max;
  }, 0);
  await tx.correlativo.updateMany({ where: { entidad, ultimoNumero: { lt: maximum } }, data: { ultimoNumero: maximum } });
  const counter = await tx.correlativo.update({ where: { entidad }, data: { ultimoNumero: { increment: 1 } } });
  return `${prefijo}${String(counter.ultimoNumero).padStart(3, "0")}`;
}
