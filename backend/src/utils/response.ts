import type { Response } from "express";
import type { ZodError } from "zod";

export type ApiSuccessBody<T = Record<string, unknown>> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors: string[];
};

export const DEFAULT_SUCCESS_MESSAGE = "Operación realizada correctamente";

export function zodToErrorList(err: ZodError): string[] {
  const flat = err.flatten();
  const list: string[] = [];
  for (const [field, msgs] of Object.entries(flat.fieldErrors)) {
    if (msgs?.length) list.push(`${field}: ${msgs.join(", ")}`);
  }
  if (flat.formErrors.length) list.push(...flat.formErrors.map(String));
  return list.length ? list : ["Validación fallida"];
}

export function successPayload<T extends Record<string, unknown>>(
  data: T,
  message = DEFAULT_SUCCESS_MESSAGE,
): ApiSuccessBody<T> {
  return { success: true, message, data };
}

export function sendSuccess<T extends Record<string, unknown>>(
  res: Response,
  data: T,
  message = DEFAULT_SUCCESS_MESSAGE,
  status = 200,
): Response {
  return res.status(status).json(successPayload(data, message));
}

export function sendCreated<T extends Record<string, unknown>>(
  res: Response,
  data: T,
  message = "Recurso creado correctamente",
): Response {
  return sendSuccess(res, data, message, 201);
}

export function errorPayload(message: string, errors: string[] = []): ApiErrorBody {
  return { success: false, message, errors };
}
