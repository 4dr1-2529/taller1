import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";

export async function listNiveles(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.nivelEducativo.findMany({
      include: {
        grados: {
          orderBy: { numero: "asc" },
          include: {
            secciones: { where: { activo: true }, orderBy: { nombre: "asc" } },
            _count: { select: { secciones: true, cursosGrado: true } },
          },
        },
      },
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function listSecciones(req: Request, res: Response, next: NextFunction) {
  try {
    const gradoId = req.query.gradoId ? Number(req.query.gradoId) : undefined;
    const items = await prisma.seccion.findMany({
      where: { activo: true, ...(gradoId ? { gradoId } : {}) },
      include: {
        grado: { include: { nivel: true } },
        tutor: true,
        _count: { select: { estudiantes: true } },
      },
      orderBy: [{ grado: { numero: "asc" } }, { nombre: "asc" }],
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function listCursosCatalogo(req: Request, res: Response, next: NextFunction) {
  try {
    const gradoId = req.query.gradoId ? Number(req.query.gradoId) : undefined;
    if (gradoId) {
      const items = await prisma.cursoPorGrado.findMany({
        where: { gradoId },
        include: { cursoCatalogo: true, grado: true },
      });
      return res.json({ ok: true, items });
    }
    const items = await prisma.cursoCatalogo.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function createSeccion(req: Request, res: Response, next: NextFunction) {
  try {
    const { gradoId, nombre, capacidad, tutorId } = req.body as {
      gradoId: number;
      nombre: string;
      capacidad?: number;
      tutorId?: string;
    };
    const item = await prisma.seccion.create({
      data: {
        gradoId,
        nombre: nombre.toUpperCase(),
        capacidad: capacidad ?? 30,
        tutorId: tutorId || null,
      },
      include: { grado: { include: { nivel: true } } },
    });
    res.status(201).json({ ok: true, item });
  } catch (e) {
    next(e);
  }
}
