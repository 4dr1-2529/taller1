import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: "Validación fallida",
      details: err.flatten().fieldErrors,
    });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ ok: false, error: err.message, code: err.code });
  }
  console.error(err);
  return res.status(500).json({ ok: false, error: "Error interno del servidor" });
}
