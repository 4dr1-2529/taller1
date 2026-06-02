import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { login, refresh, me, changePassword } from "../controllers/auth.controller.js";
import { createStudent, getStudent, listStudents, updateStudent, deleteStudent } from "../controllers/students.controller.js";
import {
  listTeachers,
  createTeacher,
  createTeacherAccount,
  updateTeacher,
  deleteTeacher,
} from "../controllers/teachers.controller.js";
import { listCourses, createCourse, updateCourse, deleteCourse } from "../controllers/courses.controller.js";
import { dashboardStats, predict } from "../controllers/predict.controller.js";
import { listPredictions, getPrediction } from "../controllers/predictions.controller.js";
import { listAlerts, patchAlertStatus } from "../controllers/alerts.controller.js";
import {
  listMessageRooms,
  listMessages,
  markRoomRead,
  sendMessage,
} from "../controllers/messages.controller.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import {
  listNiveles,
  listSecciones,
  listCursosCatalogo,
  createSeccion,
} from "../controllers/academic-structure.controller.js";
import { listUsers, createUser, updateUser, deleteUser, getAuditLogs, getSystemStats } from "../controllers/admin.controller.js";
import { listAttendance, createAttendance, bulkAttendance, updateAttendance, deleteAttendance } from "../controllers/attendance.controller.js";
import { listGrades, createGrade, deleteGrade } from "../controllers/grades.controller.js";
import { listReports, createReport, deleteReport, saveDashboardSnapshot, getDashboardSnapshot, listStudentRisks, createStudentRisk, applyRecommendation } from "../controllers/reports.controller.js";
import { prisma } from "../utils/prisma.js";
import { enrollmentSchema } from "../validators/schemas.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/errorHandler.js";

import { getMlMetrics } from "../services/ml-client.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "tesis-api", version: "2.0.0" });
});

router.post("/auth/login", login);
router.post("/auth/refresh", refresh);
router.get("/auth/me", authenticate, me);
router.post("/auth/change-password", authenticate, changePassword);

router.get("/academic/niveles", authenticate, listNiveles);
router.get("/academic/secciones", authenticate, listSecciones);
router.post("/academic/secciones", authenticate, authorize("admin"), createSeccion);
router.get("/academic/cursos-catalogo", authenticate, listCursosCatalogo);

router.get("/students", authenticate, listStudents);
router.post("/students", authenticate, authorize("admin"), createStudent);
router.get("/students/:id", authenticate, getStudent);
router.put("/students/:id", authenticate, authorize("admin"), updateStudent);
router.delete("/students/:id", authenticate, authorize("admin"), deleteStudent);

router.get("/teachers", authenticate, listTeachers);
router.post("/teachers", authenticate, authorize("admin"), createTeacher);
router.post("/teachers/:id/account", authenticate, authorize("admin"), createTeacherAccount);
router.put("/teachers/:id", authenticate, authorize("admin"), updateTeacher);
router.delete("/teachers/:id", authenticate, authorize("admin"), deleteTeacher);

router.get("/courses", authenticate, listCourses);
router.post("/courses", authenticate, authorize("admin", "docente"), createCourse);
router.put("/courses/:id", authenticate, authorize("admin", "docente"), updateCourse);
router.delete("/courses/:id", authenticate, authorize("admin"), deleteCourse);

router.get("/enrollments", authenticate, async (req, res, next) => {
  try {
    const scope = await resolveStudentScope(req.user!);
    const items = await prisma.enrollment.findMany({
      where: { student: scope },
      include: { student: true, course: true },
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
});
router.post("/enrollments", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const data = enrollmentSchema.parse(req.body);
    await assertStudentInScope(req.user!, data.studentId);
    const [student, course] = await Promise.all([
      prisma.student.findUnique({ where: { id: data.studentId }, select: { seccionId: true } }),
      prisma.course.findUnique({ where: { id: data.courseId }, select: { seccionId: true, nombre: true } }),
    ]);
    if (!student || !course) {
      throw new AppError(404, "Estudiante o curso no encontrado");
    }
    if (course.seccionId && student.seccionId && course.seccionId !== student.seccionId) {
      throw new AppError(
        400,
        `El curso "${course.nombre}" no pertenece a la sección del estudiante`,
      );
    }
    const item = await prisma.enrollment.create({ data });
    res.status(201).json({ ok: true, item });
  } catch (e) {
    next(e);
  }
});

router.post("/predict", authenticate, predict);
router.get("/predictions", authenticate, listPredictions);
router.get("/predictions/:id", authenticate, getPrediction);
router.get("/dashboard/kpis", authenticate, dashboardStats);

router.get("/alerts", authenticate, listAlerts);
router.patch("/alerts/:id", authenticate, authorize("admin", "docente"), patchAlertStatus);

router.get("/messages/rooms", authenticate, listMessageRooms);
router.get("/messages/:roomId", authenticate, listMessages);
router.patch("/messages/:roomId/read", authenticate, markRoomRead);
router.post("/messages", authenticate, sendMessage);

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
router.patch("/notifications/:id/read", authenticate, async (req, res, next) => {
  try {
    const item = await prisma.notification.updateMany({
      where: { id: paramId(req), userId: req.user!.sub },
      data: { leida: true },
    });
    res.json({ ok: true, updated: item.count });
  } catch (e) {
    next(e);
  }
});

router.get("/ml/metrics", authenticate, authorize("admin", "docente"), async (_req, res) => {
  const metrics = await getMlMetrics();
  res.json({ ok: true, metrics: metrics ?? { message: "ML service no disponible" } });
});

router.get("/grades", authenticate, listGrades);
router.post("/grades", authenticate, authorize("admin", "docente"), createGrade);
router.delete("/grades/:id", authenticate, authorize("admin", "docente"), deleteGrade);

router.get("/attendance", authenticate, listAttendance);
router.post("/attendance", authenticate, authorize("admin", "docente"), createAttendance);
router.post("/attendance/bulk", authenticate, authorize("admin", "docente"), bulkAttendance);
router.put("/attendance/:id", authenticate, authorize("admin", "docente"), updateAttendance);
router.delete("/attendance/:id", authenticate, authorize("admin"), deleteAttendance);

router.get("/reports", authenticate, listReports);
router.post("/reports", authenticate, authorize("admin", "docente"), createReport);
router.delete("/reports/:id", authenticate, authorize("admin"), deleteReport);

router.get("/dashboard-snapshot/:periodo", authenticate, getDashboardSnapshot);
router.post("/dashboard-snapshot", authenticate, authorize("admin", "docente"), saveDashboardSnapshot);

router.get("/student-risks", authenticate, listStudentRisks);
router.post("/student-risks", authenticate, authorize("admin", "docente"), createStudentRisk);

router.patch("/recommendations/:id/apply", authenticate, applyRecommendation);

router.get("/admin/users", authenticate, authorize("admin"), listUsers);
router.post("/admin/users", authenticate, authorize("admin"), createUser);
router.put("/admin/users/:id", authenticate, authorize("admin"), updateUser);
router.delete("/admin/users/:id", authenticate, authorize("admin"), deleteUser);
router.get("/admin/audit-logs", authenticate, authorize("admin"), getAuditLogs);
router.get("/admin/system-stats", authenticate, authorize("admin"), getSystemStats);

export default router;
