import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import type { MensajeAlcance, RolCodigo } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { messageSchema } from "../validators/schemas.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { AppError } from "../middleware/errorHandler.js";
import { paramId } from "../utils/ids.js";
import { toDbId, idToString } from "../utils/ids.js";
import { courseDisplayName } from "../utils/course-label.js";

function directRoom(userA: string, userB: string) {
  const ids = [userA, userB].sort((a, b) => a.localeCompare(b));
  return `direct:${ids[0]}:${ids[1]}`;
}

async function getOrCreateSala(
  roomId: string,
  alcance: MensajeAlcance,
  cursoOfertaId?: bigint,
) {
  return prisma.mensajeSala.upsert({
    where: { roomId },
    create: { roomId, alcance, cursoOfertaId: cursoOfertaId ?? null },
    update: {},
  });
}

async function assertRoomAccess(user: { sub: string; role: RolCodigo }, roomId: string) {
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
      const teacher = await prisma.teacher.findFirst({ where: { usuarioId: toDbId(user.sub) } });
      const course = await prisma.course.findFirst({
        where: { id: toDbId(courseId), profesorId: teacher?.id },
      });
      if (!course) throw new AppError(403, "Curso no asignado");
    } else if (user.role === "estudiante") {
      const student = await prisma.student.findFirst({ where: { usuarioId: toDbId(user.sub) } });
      const en = await prisma.enrollment.findFirst({
        where: { studentId: student?.id, cursoOfertaId: toDbId(courseId) },
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
  scope: MensajeAlcance,
  roomId: string,
  senderId: string,
  explicitRecipient?: string | null,
): Promise<bigint[]> {
  if (explicitRecipient) return [toDbId(explicitRecipient)];
  const senderBig = toDbId(senderId);
  if (scope === "global") {
    const users = await prisma.user.findMany({
      where: { activo: true, id: { not: senderBig } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
  if (scope === "profesores") {
    const teachers = await prisma.user.findMany({
      where: { activo: true, rol: { codigo: "docente" } },
      select: { id: true },
    });
    return teachers.map((t) => t.id);
  }
  if (scope === "curso" && roomId.startsWith("curso:")) {
    const courseId = toDbId(roomId.replace("curso:", ""));
    const enrollments = await prisma.enrollment.findMany({
      where: { cursoOfertaId: courseId },
      include: { student: { select: { usuarioId: true } } },
    });
    const ids = enrollments
      .map((e) => e.student.usuarioId)
      .filter((id): id is bigint => id != null);
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { profesor: { select: { usuarioId: true } } },
    });
    if (course?.profesor?.usuarioId) ids.push(course.profesor.usuarioId);
    return [...new Set(ids.map((id) => id.toString()))]
      .map((id) => toDbId(id))
      .filter((id) => id !== senderBig);
  }
  if (roomId.startsWith("direct:")) {
    const parts = roomId.split(":");
    const other = parts[1] === senderId ? parts[2] : parts[1];
    return [toDbId(other)];
  }
  return [];
}

type MessageRow = {
  id: bigint;
  contenido: string;
  createdAt: Date;
  destinatarioId: bigint | null;
  remitente: { id: bigint; nombres: string; apellidos: string; rol: { codigo: RolCodigo } };
  sala: { roomId: string; alcance: MensajeAlcance };
  lecturas: { usuarioId: bigint; leido: boolean; leidoAt: Date | null }[];
};

function mapMessage(m: MessageRow, viewerId: string) {
  const viewerBig = toDbId(viewerId);
  const myRead = m.lecturas.find((r) => r.usuarioId === viewerBig);
  return {
    id: idToString(m.id),
    roomId: m.sala.roomId,
    scope: m.sala.alcance,
    remitente: {
      id: idToString(m.remitente.id),
      nombre: `${m.remitente.nombres} ${m.remitente.apellidos}`,
      rol: m.remitente.rol.codigo,
    },
    destinatarioId: m.destinatarioId ? idToString(m.destinatarioId) : null,
    contenido: m.contenido,
    fecha: m.createdAt,
    leida: myRead?.leido ?? false,
    readAt: myRead?.leidoAt ?? null,
  };
}

export async function listMessageRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const rooms: { roomId: string; label: string; scope: MensajeAlcance }[] = [];

    if (user.role === "admin") {
      rooms.push(
        { roomId: "global:institucional", label: "Comunicado global", scope: "global" },
        { roomId: "canal:profesores", label: "Mensajes a profesores", scope: "profesores" },
      );
    }

    if (user.role === "docente") {
      const teacher = await prisma.teacher.findFirst({ where: { usuarioId: toDbId(user.sub) } });
      if (teacher) {
        const courses = await prisma.course.findMany({
          where: { profesorId: teacher.id, activo: true },
          include: { cursoCatalogo: { select: { nombre: true } } },
        });
        for (const c of courses) {
          rooms.push({
            roomId: `curso:${idToString(c.id)}`,
            label: `Aviso — ${courseDisplayName(c)}`,
            scope: "curso",
          });
        }
        const enrollments = await prisma.enrollment.findMany({
          where: { course: { profesorId: teacher.id } },
          include: { student: { select: { usuarioId: true, nombres: true, apellidos: true } } },
        });
        const seen = new Set<string>();
        for (const e of enrollments) {
          const uid = e.student.usuarioId ? idToString(e.student.usuarioId) : null;
          if (!uid || seen.has(uid)) continue;
          seen.add(uid);
          rooms.push({
            roomId: directRoom(user.sub, uid),
            label: `${e.student.nombres} ${e.student.apellidos}`,
            scope: "directo",
          });
        }
      }
    }

    if (user.role === "estudiante") {
      const student = await prisma.student.findFirst({
        where: { usuarioId: toDbId(user.sub) },
        include: {
          inscripciones: {
            include: {
              course: {
                include: {
                  cursoCatalogo: { select: { nombre: true } },
                  profesor: { include: { usuario: { select: { id: true } } } },
                },
              },
            },
          },
        },
      });
      if (student) {
        rooms.push({ roomId: "global:institucional", label: "Comunicados institucionales", scope: "global" });
        const seen = new Set<string>();
        for (const en of student.inscripciones) {
          const profUserId = en.course.profesor?.usuario?.id;
          if (profUserId && !seen.has(idToString(profUserId))) {
            seen.add(idToString(profUserId));
            rooms.push({
              roomId: directRoom(idToString(profUserId), user.sub),
              label: `Prof. ${en.course.profesor?.nombres ?? ""} ${en.course.profesor?.apellidos ?? ""}`.trim(),
              scope: "directo",
            });
          }
          rooms.push({
            roomId: `curso:${idToString(en.cursoOfertaId)}`,
            label: `Avisos — ${courseDisplayName(en.course)}`,
            scope: "curso",
          });
        }
      }
    }

    sendSuccess(res, { rooms });
  } catch (e) {
    next(e);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const roomId = paramId(req, "roomId");
    const user = req.user!;
    await assertRoomAccess(user, roomId);

    const sala = await prisma.mensajeSala.findUnique({ where: { roomId } });
    if (!sala) {
      return sendSuccess(res, { items: [] });
    }

    const rows = await prisma.chatMessage.findMany({
      where: { salaId: sala.id },
      orderBy: { createdAt: "asc" },
      take: 150,
      include: {
        sala: true,
        remitente: { include: { rol: { select: { codigo: true } } } },
        lecturas: true,
      },
    });

    const items = rows.map((m) => mapMessage(m, user.sub));
    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
}

export async function markRoomRead(req: Request, res: Response, next: NextFunction) {
  try {
    const roomId = paramId(req, "roomId");
    const user = req.user!;
    await assertRoomAccess(user, roomId);

    const sala = await prisma.mensajeSala.findUnique({ where: { roomId } });
    if (!sala) {
      return sendSuccess(res, { marked: 0 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { salaId: sala.id },
      select: { id: true },
    });

    const usuarioId = toDbId(user.sub);
    const now = new Date();
    for (const m of messages) {
      await prisma.messageRead.upsert({
        where: { mensajeId_usuarioId: { mensajeId: m.id, usuarioId } },
        create: { mensajeId: m.id, usuarioId, leido: true, leidoAt: now },
        update: { leido: true, leidoAt: now },
      });
    }

    sendSuccess(res, { marked: messages.length });
  } catch (e) {
    next(e);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = messageSchema.parse(req.body);
    const user = req.user!;
    const dbUser = await prisma.user.findUnique({
      where: { id: toDbId(user.sub) },
      include: { rol: { select: { codigo: true } } },
    });
    if (!dbUser) throw new AppError(401, "Usuario no encontrado");

    let scope: MensajeAlcance = (data.scope ?? "directo") as MensajeAlcance;
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
        const teacher = await prisma.teacher.findFirst({ where: { usuarioId: toDbId(user.sub) } });
        const course = await prisma.course.findFirst({
          where: { id: toDbId(courseId), profesorId: teacher?.id },
        });
        if (!course) throw new AppError(403, "Curso no asignado");
      }
      roomId = `curso:${courseId}`;
    }
    if (scope === "directo" && recipientUserId) {
      if (user.role === "docente") {
        const student = await prisma.student.findFirst({ where: { usuarioId: toDbId(recipientUserId) } });
        if (student) await assertStudentInScope(user, idToString(student.id));
      }
      roomId = directRoom(
        user.role === "estudiante" ? recipientUserId : user.sub,
        user.role === "estudiante" ? user.sub : recipientUserId,
      );
    }

    if (!roomId) throw new AppError(400, "roomId requerido");

    const cursoOfertaId =
      scope === "curso" && roomId.startsWith("curso:")
        ? toDbId(roomId.replace("curso:", ""))
        : undefined;

    const sala = await getOrCreateSala(roomId, scope, cursoOfertaId);

    const msg = await prisma.chatMessage.create({
      data: {
        salaId: sala.id,
        remitenteId: dbUser.id,
        destinatarioId: recipientUserId ? toDbId(recipientUserId) : null,
        contenido: data.contenido,
        mensajePadreId: data.parentMessageId ? toDbId(data.parentMessageId) : null,
      },
      include: {
        sala: true,
        remitente: { include: { rol: { select: { codigo: true } } } },
        lecturas: true,
      },
    });

    const recipients = await recipientUserIdsForMessage(scope, roomId, user.sub, recipientUserId);
    if (recipients.length) {
      await prisma.messageRead.createMany({
        data: recipients.map((usuarioId) => ({
          mensajeId: msg.id,
          usuarioId,
          leido: false,
        })),
        skipDuplicates: true,
      });
    }
    await prisma.messageRead.upsert({
      where: { mensajeId_usuarioId: { mensajeId: msg.id, usuarioId: dbUser.id } },
      create: { mensajeId: msg.id, usuarioId: dbUser.id, leido: true, leidoAt: new Date() },
      update: { leido: true, leidoAt: new Date() },
    });

    sendCreated(res, { message: mapMessage(msg, user.sub), });
  } catch (e) {
    next(e);
  }
}
