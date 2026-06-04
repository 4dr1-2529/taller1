import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { errorPayload, zodToErrorList } from "../utils/response.js";

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
  _next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  if (err instanceof ZodError) {
    return res.status(400).json(errorPayload("Validación fallida", zodToErrorList(err)));
  }
  if (err instanceof AppError) {
    const errors = err.code ? [err.code] : [];
    return res.status(err.statusCode).json(errorPayload(err.message, errors));
  }
  if (env.NODE_ENV !== "production") {
    console.error(err);
  }
  return res.status(500).json(errorPayload("Error interno del servidor"));
}
