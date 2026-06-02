import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { toDbId, idToString } from "../utils/ids.js";

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
    const gradoId = req.query.gradoId as string | undefined;
    const items = await prisma.seccion.findMany({
      where: { activo: true, ...(gradoId ? { gradoId: toDbId(gradoId) } : {}) },
      include: {
        grado: { include: { nivel: true } },
        _count: { select: { estudiantes: true } },
      },
      orderBy: [{ grado: { numero: "asc" } }, { nombre: "asc" }],
    });
    res.json({
      ok: true,
      items: items.map((s) => ({ ...s, id: idToString(s.id), gradoId: idToString(s.gradoId) })),
    });
  } catch (e) {
    next(e);
  }
}

export async function listCursosCatalogo(req: Request, res: Response, next: NextFunction) {
  try {
    const gradoId = req.query.gradoId as string | undefined;
    if (gradoId) {
      const items = await prisma.cursoGrado.findMany({
        where: { gradoId: toDbId(gradoId) },
        include: { curso: true, grado: true },
      });
      return res.json({
        ok: true,
        items: items.map((row) => ({
          ...row,
          id: idToString(row.id),
          cursoCatalogo: row.curso,
        })),
      });
    }
    const items = await prisma.cursoCatalogo.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });
    res.json({
      ok: true,
      items: items.map((c) => ({ ...c, id: idToString(c.id) })),
    });
  } catch (e) {
    next(e);
  }
}

export async function createSeccion(req: Request, res: Response, next: NextFunction) {
  try {
    const { gradoId, nombre, capacidad } = req.body as {
      gradoId: string | number;
      nombre: string;
      capacidad?: number;
    };
    const item = await prisma.seccion.create({
      data: {
        gradoId: toDbId(String(gradoId)),
        nombre: nombre.toUpperCase(),
        capacidad: capacidad ?? 30,
      },
      include: { grado: { include: { nivel: true } } },
    });
    res.status(201).json({ ok: true, item: { ...item, id: idToString(item.id) } });
  } catch (e) {
    next(e);
  }
}
