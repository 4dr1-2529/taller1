import type { Response } from "express";
import type { ZodError } from "zod";

export type ApiSuccessBody<T = Record<string, unknown>> = {
  success: true;
  message: string;
  data: T;
};

export type FieldError = {
  field: string;
  message: string;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors: FieldError[];
};

export const DEFAULT_SUCCESS_MESSAGE = "Operación realizada correctamente";

export function zodToFieldErrors(err: ZodError): FieldError[] {
  const flat = err.flatten();
  const list: FieldError[] = [];
  for (const [field, msgs] of Object.entries(flat.fieldErrors)) {
    if (msgs?.length) {
      for (const message of msgs) list.push({ field, message: String(message) });
    }
  }
  for (const message of flat.formErrors) {
    list.push({ field: "_form", message: String(message) });
  }
  return list.length ? list : [{ field: "_form", message: "Validación fallida" }];
}

/** @deprecated Use zodToFieldErrors for structured API responses */
export function zodToErrorList(err: ZodError): string[] {
  return zodToFieldErrors(err).map((e) =>
    e.field === "_form" ? e.message : `${e.field}: ${e.message}`,
  );
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

export function errorPayload(message: string, errors: FieldError[] = []): ApiErrorBody {
  return { success: false, message, errors };
}
