import type { Request } from "express";
import { AppError } from "../middleware/errorHandler.js";

export function toDbId(id: string | bigint | number): bigint {
  if (typeof id === "bigint") return id;
  if (typeof id === "number") return BigInt(id);
  const trimmed = id.trim();
  if (!/^\d+$/.test(trimmed)) throw new AppError(400, "Identificador inválido");
  return BigInt(trimmed);
}

export function paramId(req: Request, key = "id"): string {
  const value = req.params[key];
  if (typeof value === "string" && value.length > 0) return value;
  throw new AppError(400, "Parámetro inválido");
}

export function paramBigIntId(req: Request, key = "id"): bigint {
  return toDbId(paramId(req, key));
}

export function idToString(id: bigint | number | string): string {
  return id.toString();
}
