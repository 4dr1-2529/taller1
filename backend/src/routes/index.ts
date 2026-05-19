import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { login, me } from "../controllers/auth.controller.js";
import { createStudent, getStudent, listStudents } from "../controllers/students.controller.js";
import { dashboardStats, predict } from "../controllers/predict.controller.js";
import { prisma } from "../utils/prisma.js";
import {
  enrollmentSchema,
  chatSchema,
  psychFollowUpSchema,
  alertStatusSchema,
} from "../validators/schemas.js";
import { logAudit } from "../utils/audit.js";
import { getMlMetrics } from "../services/ml-client.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "tesis-api", version: "2.0.0" });
});

router.post("/auth/login", login);
router.get("/auth/me", authenticate, me);

router.get("/students", authenticate, listStudents);
router.post("/students", authenticate, authorize("admin", "tutor", "docente"), createStudent);
router.get("/students/:id", authenticate, getStudent);

router.get("/teachers", authenticate, async (_req, res, next) => {
  try {
    const items = await prisma.teacher.findMany({ where: { activo: true } });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
});

router.get("/courses", authenticate, async (_req, res, next) => {
  try {
    const items = await prisma.course.findMany({
      include: { profesor: true },
      where: { activo: true },
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
});

router.get("/enrollments", authenticate, async (_req, res, next) => {
  try {
    const items = await prisma.enrollment.findMany({
      include: { student: true, course: true },
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
});

router.post("/enrollments", authenticate, authorize("admin", "docente"), async (req, res, next) => {
  try {
    const data = enrollmentSchema.parse(req.body);
    const item = await prisma.enrollment.create({ data });
    res.status(201).json({ ok: true, item });
  } catch (e) {
    next(e);
  }
});

router.post("/predict", authenticate, predict);
router.get("/dashboard/kpis", authenticate, dashboardStats);

router.get("/alerts", authenticate, async (_req, res, next) => {
  try {
    const items = await prisma.alert.findMany({
      where: { status: { in: ["abierta", "en_seguimiento"] } },
      include: { student: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
});

router.patch("/alerts/:id", authenticate, authorize("admin", "tutor", "psicologo"), async (req, res, next) => {
  try {
    const { status } = alertStatusSchema.parse(req.body);
    const item = await prisma.alert.update({
      where: { id: req.params.id },
      data: { status },
      include: { student: true },
    });
    await logAudit({
      entidad: "Alert",
      entidadId: item.id,
      accion: "UPDATE_STATUS",
      detalle: status,
      studentId: item.studentId,
    });
    res.json({ ok: true, item });
  } catch (e) {
    next(e);
  }
});

router.get("/psych-followups", authenticate, async (req, res, next) => {
  try {
    const studentId = req.query.studentId as string | undefined;
    const items = await prisma.psychologicalFollowUp.findMany({
      where: studentId ? { studentId } : undefined,
      include: { student: true },
      orderBy: { fecha: "desc" },
      take: 50,
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/psych-followups",
  authenticate,
  authorize("admin", "psicologo", "tutor"),
  async (req, res, next) => {
    try {
      const data = psychFollowUpSchema.parse(req.body);
      const item = await prisma.psychologicalFollowUp.create({
        data: {
          studentId: data.studentId,
          resumen: data.resumen,
          acciones: data.acciones,
          profesional: data.profesional,
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
        },
        include: { student: true },
      });
      await logAudit({
        entidad: "PsychologicalFollowUp",
        entidadId: item.id,
        accion: "CREATE",
        studentId: item.studentId,
        detalle: data.resumen.slice(0, 120),
      });
      res.status(201).json({ ok: true, item });
    } catch (e) {
      next(e);
    }
  },
);

router.patch("/notifications/:id/read", authenticate, async (req, res, next) => {
  try {
    const item = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.sub },
      data: { leida: true },
    });
    res.json({ ok: true, updated: item.count });
  } catch (e) {
    next(e);
  }
});

router.get("/notifications", authenticate, async (req, res, next) => {
  try {
    const items = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
});

router.get("/ml/metrics", authenticate, authorize("admin", "docente", "tutor"), async (_req, res) => {
  const metrics = await getMlMetrics();
  res.json({ ok: true, metrics: metrics ?? { message: "ML service no disponible" } });
});

router.get("/chat/:roomId", authenticate, async (req, res, next) => {
  try {
    const items = await prisma.chatMessage.findMany({
      where: { roomId: req.params.roomId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
});

router.post("/chat", authenticate, async (req, res, next) => {
  try {
    const data = chatSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    const msg = await prisma.chatMessage.create({
      data: {
        roomId: data.roomId,
        senderId: req.user!.sub,
        senderName: `${user?.nombres} ${user?.apellidos}`,
        senderRole: req.user!.role,
        contenido: data.contenido,
      },
    });
    res.status(201).json({ ok: true, message: msg });
  } catch (e) {
    next(e);
  }
});

export default router;
