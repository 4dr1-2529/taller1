import type { Request, Response, NextFunction } from "express";
import type { MessageScope, UserRole } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { messageSchema } from "../validators/schemas.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { AppError } from "../middleware/errorHandler.js";
import { paramId } from "../utils/params.js";

function directRoom(userA: string, userB: string) {
  const ids = [userA, userB].sort();
  return `direct:${ids[0]}:${ids[1]}`;
}

async function assertRoomAccess(user: { sub: string; role: UserRole }, roomId: string) {
  if (roomId.startsWith("direct:")) {
    const parts = roomId.split(":");
    if (parts.length !== 3 || ![parts[1], parts[2]].includes(user.sub)) {
      throw new AppError(403, "Sin acceso a esta conversación");
    }
    return;
  }
  if (roomId === "canal:profesores" && user.role === "estudiante") {
    throw new AppError(403, "Canal solo para personal docente");
  }
  if (roomId.startsWith("curso:")) {
    const courseId = roomId.replace("curso:", "");
    if (user.role === "docente") {
      const teacher = await prisma.teacher.findFirst({ where: { userId: user.sub } });
      const course = await prisma.course.findFirst({
        where: { id: courseId, profesorId: teacher?.id },
      });
      if (!course) throw new AppError(403, "Curso no asignado");
    } else if (user.role === "estudiante") {
      const student = await prisma.student.findFirst({ where: { userId: user.sub } });
      const en = await prisma.enrollment.findFirst({
        where: { studentId: student?.id, courseId },
      });
      if (!en) throw new AppError(403, "No matriculado en este curso");
    }
    return;
  }
  if (roomId !== "global:institucional" && user.role !== "admin") {
    throw new AppError(403, "Sin acceso");
  }
}

async function recipientUserIdsForMessage(
  scope: MessageScope,
  roomId: string,
  senderId: string,
  explicitRecipient?: string | null,
): Promise<string[]> {
  if (explicitRecipient) return [explicitRecipient];
  if (scope === "global") {
    const users = await prisma.user.findMany({
      where: { activo: true, id: { not: senderId } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
  if (scope === "profesores") {
    const teachers = await prisma.user.findMany({
      where: { role: "docente", activo: true },
      select: { id: true },
    });
    return teachers.map((t) => t.id);
  }
  if (scope === "curso" && roomId.startsWith("curso:")) {
    const courseId = roomId.replace("curso:", "");
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: { student: { select: { userId: true } } },
    });
    const ids = enrollments.map((e) => e.student.userId).filter((id): id is string => !!id);
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { profesor: { select: { userId: true } } },
    });
    if (course?.profesor?.userId) ids.push(course.profesor.userId);
    return [...new Set(ids)].filter((id) => id !== senderId);
  }
  if (roomId.startsWith("direct:")) {
    const parts = roomId.split(":");
    const other = parts[1] === senderId ? parts[2] : parts[1];
    return [other];
  }
  return [];
}

function mapMessage(
  m: {
    id: string;
    roomId: string;
    scope: MessageScope;
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    recipientUserId: string | null;
    contenido: string;
    createdAt: Date;
    reads: { userId: string; leida: boolean; readAt: Date | null }[];
  },
  viewerId: string,
) {
  const myRead = m.reads.find((r) => r.userId === viewerId);
  return {
    id: m.id,
    roomId: m.roomId,
    scope: m.scope,
    remitente: { id: m.senderId, nombre: m.senderName, rol: m.senderRole },
    destinatarioId: m.recipientUserId,
    contenido: m.contenido,
    fecha: m.createdAt,
    leida: myRead?.leida ?? false,
    readAt: myRead?.readAt ?? null,
  };
}

export async function listMessageRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const rooms: { roomId: string; label: string; scope: MessageScope }[] = [];

    if (user.role === "admin") {
      rooms.push(
        { roomId: "global:institucional", label: "Comunicado global", scope: "global" },
        { roomId: "canal:profesores", label: "Mensajes a profesores", scope: "profesores" },
      );
    }

    if (user.role === "docente") {
      const teacher = await prisma.teacher.findFirst({ where: { userId: user.sub } });
      if (teacher) {
        const courses = await prisma.course.findMany({
          where: { profesorId: teacher.id, activo: true },
          select: { id: true, nombre: true },
        });
        for (const c of courses) {
          rooms.push({ roomId: `curso:${c.id}`, label: `Aviso — ${c.nombre}`, scope: "curso" });
        }
        const enrollments = await prisma.enrollment.findMany({
          where: { course: { profesorId: teacher.id } },
          include: { student: { select: { userId: true, nombres: true, apellidos: true } } },
        });
        const seen = new Set<string>();
        for (const e of enrollments) {
          if (!e.student.userId || seen.has(e.student.userId)) continue;
          seen.add(e.student.userId);
          rooms.push({
            roomId: directRoom(user.sub, e.student.userId),
            label: `${e.student.nombres} ${e.student.apellidos}`,
            scope: "directo",
          });
        }
      }
    }

    if (user.role === "estudiante") {
      const student = await prisma.student.findFirst({
        where: { userId: user.sub },
        include: {
          enrollments: {
            include: {
              course: {
                include: { profesor: { include: { user: { select: { id: true } } } } },
              },
            },
          },
        },
      });
      if (student) {
        rooms.push({ roomId: "global:institucional", label: "Comunicados institucionales", scope: "global" });
        const seen = new Set<string>();
        for (const en of student.enrollments) {
          const profUserId = en.course.profesor?.user?.id;
          if (profUserId && !seen.has(profUserId)) {
            seen.add(profUserId);
            rooms.push({
              roomId: directRoom(profUserId, user.sub),
              label: `Prof. ${en.course.profesor?.nombres ?? ""} ${en.course.profesor?.apellidos ?? ""}`.trim(),
              scope: "directo",
            });
          }
          rooms.push({
            roomId: `curso:${en.courseId}`,
            label: `Avisos — ${en.course.nombre}`,
            scope: "curso",
          });
        }
      }
    }

    res.json({ ok: true, rooms });
  } catch (e) {
    next(e);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const roomId = paramId(req, "roomId");
    const user = req.user!;
    await assertRoomAccess(user, roomId);

    const rows = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      take: 150,
      include: { reads: true },
    });

    const items = rows.map((m) => mapMessage(m, user.sub));
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function markRoomRead(req: Request, res: Response, next: NextFunction) {
  try {
    const roomId = paramId(req, "roomId");
    const user = req.user!;
    await assertRoomAccess(user, roomId);

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      select: { id: true },
    });

    const now = new Date();
    for (const m of messages) {
      await prisma.messageRead.upsert({
        where: { messageId_userId: { messageId: m.id, userId: user.sub } },
        create: { messageId: m.id, userId: user.sub, leida: true, readAt: now },
        update: { leida: true, readAt: now },
      });
    }

    res.json({ ok: true, marked: messages.length });
  } catch (e) {
    next(e);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = messageSchema.parse(req.body);
    const user = req.user!;
    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) throw new AppError(401, "Usuario no encontrado");

    let scope: MessageScope = data.scope ?? "directo";
    let roomId = data.roomId ?? "";
    let recipientUserId = data.recipientUserId ?? null;
    const courseId = data.courseId ?? null;

    if (scope === "global" && user.role !== "admin") {
      throw new AppError(403, "Solo el director puede enviar comunicados globales");
    }
    if (scope === "profesores" && user.role !== "admin") {
      throw new AppError(403, "Solo el director puede mensajear a profesores");
    }
    if (scope === "curso" && user.role === "estudiante") {
      throw new AppError(403, "Los estudiantes no publican avisos de curso");
    }
    if (scope === "global") roomId = "global:institucional";
    if (scope === "profesores") roomId = "canal:profesores";
    if (scope === "curso" && courseId) {
      if (user.role === "docente") {
        const teacher = await prisma.teacher.findFirst({ where: { userId: user.sub } });
        const course = await prisma.course.findFirst({
          where: { id: courseId, profesorId: teacher?.id },
        });
        if (!course) throw new AppError(403, "Curso no asignado");
      }
      roomId = `curso:${courseId}`;
    }
    if (scope === "directo" && recipientUserId) {
      if (user.role === "docente") {
        const student = await prisma.student.findFirst({ where: { userId: recipientUserId } });
        if (student) await assertStudentInScope(user, student.id);
      }
      roomId = directRoom(
        user.role === "estudiante" ? recipientUserId : user.sub,
        user.role === "estudiante" ? user.sub : recipientUserId,
      );
    }

    if (!roomId) throw new AppError(400, "roomId requerido");

    const msg = await prisma.chatMessage.create({
      data: {
        roomId,
        scope,
        senderId: user.sub,
        senderName: `${dbUser.nombres} ${dbUser.apellidos}`,
        senderRole: user.role as UserRole,
        recipientUserId,
        courseId,
        parentMessageId: data.parentMessageId ?? null,
        contenido: data.contenido,
      },
    });

    const recipients = await recipientUserIdsForMessage(scope, roomId, user.sub, recipientUserId);
    if (recipients.length) {
      await prisma.messageRead.createMany({
        data: recipients.map((userId) => ({
          messageId: msg.id,
          userId,
          leida: false,
        })),
        skipDuplicates: true,
      });
    }
    await prisma.messageRead.upsert({
      where: { messageId_userId: { messageId: msg.id, userId: user.sub } },
      create: { messageId: msg.id, userId: user.sub, leida: true, readAt: new Date() },
      update: { leida: true },
    });

    res.status(201).json({
      ok: true,
      message: mapMessage({ ...msg, reads: [] }, user.sub),
    });
  } catch (e) {
    next(e);
  }
}
