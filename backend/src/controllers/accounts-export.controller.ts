import { sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { buildStudentAccountEmail } from "../utils/person-accounts.js";
import { getInstitutionDefaultPassword } from "../config/institution-password.js";

/** Director: exportar correos de login reales (tabla usuario). */
export async function exportAccessAccounts(_req: Request, res: Response, next: NextFunction) {
  try {
    const director = await prisma.user.findFirst({
      where: { email: "director@blenkir.edu.pe", activo: true },
      select: { email: true, nombres: true, apellidos: true },
    });

    const teachers = await prisma.teacher.findMany({
      where: { activo: true },
      orderBy: { codigo: "asc" },
      include: { usuario: { select: { email: true, activo: true } } },
    });

    const students = await prisma.student.findMany({
      where: { activo: true },
      orderBy: { codigo: "asc" },
      include: {
        usuario: { select: { email: true, activo: true } },
        seccion: { include: { grado: true } },
      },
    });

    sendSuccess(res, {
      generatedAt: new Date().toISOString(),
      password: getInstitutionDefaultPassword(),
      director: director
        ? { ...director, rol: "Director" }
        : { email: "director@blenkir.edu.pe", rol: "Director" },
      teachers: teachers.map((t) => ({
        codigo: t.codigo,
        nombres: t.nombres,
        apellidos: t.apellidos,
        email: t.usuario?.email ?? t.email,
        cuentaActiva: Boolean(t.usuario?.activo),
        especialidad: t.especialidad,
        tipo: t.especialidad.startsWith("Tutor") ? "Tutor 1°-2°" : "Polidocencia 3°-6°",
      })),
      students: students.map((s) => ({
        codigo: s.codigo,
        nombres: s.nombres,
        apellidos: s.apellidos,
        email:
          s.usuario?.email ??
          buildStudentAccountEmail(s.nombres, s.apellidos, s.dni ?? "00000000", s.email),
        cuentaActiva: Boolean(s.usuario?.activo),
        salon: s.seccion ? `${s.seccion.grado.numero}° ${s.seccion.nombre}` : "—",
      })),
      totals: {
        teachers: teachers.length,
        students: students.length,
        studentsSinCuenta: students.filter((s) => !s.usuarioId).length,
      },
    });
  } catch (e) {
    next(e);
  }
}
