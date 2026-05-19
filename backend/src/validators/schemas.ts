import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const studentSchema = z.object({
  codigo: z.string().min(2).max(32),
  nombres: z.string().min(2).max(120),
  apellidos: z.string().min(2).max(120),
  nivel: z.string().min(2).max(64),
  correo: z.string().email(),
  telefono: z.string().max(20).optional(),
  estado: z.enum(["activo", "en_riesgo", "retirado"]).optional(),
  promedioGeneral: z.number().min(0).max(20).optional(),
  asistenciaGeneral: z.number().min(0).max(100).optional(),
  lmsEngagement: z.enum(["alto", "medio", "bajo"]).optional(),
});

export const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  promedio: z.number().min(0).max(20),
  asistenciaPct: z.number().min(0).max(100),
  periodo: z.string().default("2026-I"),
});

export const predictSchema = z.object({
  studentId: z.string().optional(),
  metrics: z
    .object({
      promedioGeneral: z.number().min(0).max(20),
      asistenciaGeneral: z.number().min(0).max(100),
      lms: z.object({
        engagement: z.enum(["alto", "medio", "bajo"]),
        actividadSemanalPct: z.array(z.number().min(0).max(100)),
        minutosPorSemana: z.array(z.number().min(0)),
        tareasEntregadas: z.number().min(0),
        tareasTotales: z.number().min(1),
        horasPlataformaSemana: z.number().min(0),
      }),
    })
    .optional(),
  estado: z.enum(["activo", "en_riesgo", "retirado"]).optional(),
});

export const chatSchema = z.object({
  roomId: z.string().min(1),
  contenido: z.string().min(1).max(2000),
});

export const psychFollowUpSchema = z.object({
  studentId: z.string().min(1),
  resumen: z.string().min(10).max(5000),
  acciones: z.string().max(5000).optional(),
  profesional: z.string().max(120).optional(),
  fecha: z.string().datetime().optional(),
});

export const alertStatusSchema = z.object({
  status: z.enum(["abierta", "en_seguimiento", "resuelta"]),
});
