import type { Request } from "express";
import { AppError } from "../middleware/errorHandler.js";

export function paramId(req: Request, key = "id"): string {
  const value = req.params[key];
  if (typeof value === "string" && value.length > 0) return value;
  throw new AppError(400, "Parámetro inválido");
}
