import { sendCreated, sendSuccess } from "../utils/response.js";
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
  getTeacherDetail,
} from "../controllers/teachers.controller.js";
import {
  listTeacherAssignments,
  getTeacherAssignment,
  postTeacherAssignment,
  postTutorAssignment,
  patchDeactivateAssignment,
} from "../controllers/teacher-assignments.controller.js";
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
import { resolveStudentScope } from "../utils/student-scope.js";
import {
  listNiveles,
  listSecciones,
  listCursosCatalogo,
  listAniosLectivos,
  createSeccion,
} from "../controllers/academic-structure.controller.js";
import { listUsers, createUser, updateUser, deleteUser, getAuditLogs, getSystemStats } from "../controllers/admin.controller.js";
import { exportAccessAccounts } from "../controllers/accounts-export.controller.js";
import { listAttendance, createAttendance, bulkAttendance, updateAttendance, deleteAttendance } from "../controllers/attendance.controller.js";
import { listMatriculas, createMatricula, matriculaStats } from "../controllers/matriculas.controller.js";
import { listGrades, createGrade, deleteGrade } from "../controllers/grades.controller.js";
import {
  profesorDashboard,
  profesorGrados,
  profesorSecciones,
  profesorCursos,
  profesorEstudiantes,
  profesorNotas,
  profesorNotasPost,
  profesorAsistencia,
  profesorAsistenciaMasiva,
  profesorLms,
  profesorPredicciones,
  profesorPrediccionesPost,
  profesorHistorialPredicciones,
  profesorAlertas,
  profesorAlertaEstado,
  misCursos,
  misSecciones,
  misEstudiantes,
} from "../controllers/profesor.controller.js";
import {
  estudiantePerfil,
  estudianteDashboard,
  estudianteNotas,
  estudianteAsistencia,
  estudianteLms,
  estudiantePrediccion,
  estudiantePrediccionPost,
  estudianteAlertas,
  estudianteMensajes,
} from "../controllers/estudiante.controller.js";
import { listReports, createReport, deleteReport, saveDashboardSnapshot, getDashboardSnapshot, listStudentRisks, createStudentRisk, applyRecommendation } from "../controllers/reports.controller.js";
import { prisma } from "../utils/prisma.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";

import { getMlMetrics } from "../services/ml-client.js";

const router = Router();

router.get("/health", (_req, res) => {
  sendSuccess(res, { service: "tesis-api", version: "2.0.0" });
});

router.post("/auth/login", login);
router.post("/auth/refresh", refresh);
router.get("/auth/me", authenticate, me);
router.post("/auth/change-password", authenticate, changePassword);

router.get("/academic/niveles", authenticate, listNiveles);
router.get("/academic/secciones", authenticate, listSecciones);
router.get("/academic/anios-lectivos", authenticate, listAniosLectivos);
router.post("/academic/secciones", authenticate, authorize("admin"), createSeccion);
router.get("/academic/cursos-catalogo", authenticate, listCursosCatalogo);

router.get("/students", authenticate, authorize("admin", "docente"), listStudents);
router.post("/students", authenticate, authorize("admin"), createStudent);
router.get("/students/:id", authenticate, authorize("admin", "docente"), getStudent);
router.put("/students/:id", authenticate, authorize("admin"), updateStudent);
router.delete("/students/:id", authenticate, authorize("admin"), deleteStudent);

router.get("/teachers", authenticate, listTeachers);
router.get("/teachers/:id/detail", authenticate, authorize("admin"), getTeacherDetail);
router.post("/teachers", authenticate, authorize("admin"), createTeacher);
router.post("/teachers/:id/account", authenticate, authorize("admin"), createTeacherAccount);
router.put("/teachers/:id", authenticate, authorize("admin"), updateTeacher);
router.delete("/teachers/:id", authenticate, authorize("admin"), deleteTeacher);

router.get("/teacher-assignments", authenticate, authorize("admin"), listTeacherAssignments);
router.get("/teacher-assignments/:id", authenticate, authorize("admin"), getTeacherAssignment);
router.post("/teacher-assignments", authenticate, authorize("admin"), postTeacherAssignment);
router.post("/teacher-assignments/tutor", authenticate, authorize("admin"), postTutorAssignment);
router.patch("/teacher-assignments/:id/deactivate", authenticate, authorize("admin"), patchDeactivateAssignment);

router.get("/profesor/dashboard", authenticate, authorize("docente"), profesorDashboard);
router.get("/profesor/grados", authenticate, authorize("docente"), profesorGrados);
router.get("/profesor/secciones", authenticate, authorize("docente"), profesorSecciones);
router.get("/profesor/cursos", authenticate, authorize("docente"), profesorCursos);
router.get("/profesor/estudiantes", authenticate, authorize("docente"), profesorEstudiantes);
router.get("/profesor/notas", authenticate, authorize("docente"), profesorNotas);
router.post("/profesor/notas", authenticate, authorize("docente"), profesorNotasPost);
router.get("/profesor/asistencia", authenticate, authorize("docente"), profesorAsistencia);
router.post("/profesor/asistencia/masiva", authenticate, authorize("docente"), profesorAsistenciaMasiva);
router.get("/profesor/lms", authenticate, authorize("docente"), profesorLms);
router.get("/profesor/predicciones", authenticate, authorize("docente"), profesorPredicciones);
router.post("/profesor/predicciones", authenticate, authorize("docente"), profesorPrediccionesPost);
router.get("/profesor/historial-predicciones", authenticate, authorize("docente"), profesorHistorialPredicciones);
router.get("/profesor/alertas", authenticate, authorize("docente"), profesorAlertas);
router.patch("/profesor/alertas/:id/estado", authenticate, authorize("docente"), profesorAlertaEstado);
router.get("/profesor/mis-cursos", authenticate, authorize("docente"), misCursos);
router.get("/profesor/mis-secciones", authenticate, authorize("docente"), misSecciones);
router.get("/profesor/mis-estudiantes", authenticate, authorize("docente"), misEstudiantes);

router.get("/estudiante/perfil", authenticate, authorize("estudiante"), estudiantePerfil);
router.get("/estudiante/dashboard", authenticate, authorize("estudiante"), estudianteDashboard);
router.get("/estudiante/notas", authenticate, authorize("estudiante"), estudianteNotas);
router.get("/estudiante/asistencia", authenticate, authorize("estudiante"), estudianteAsistencia);
router.get("/estudiante/lms", authenticate, authorize("estudiante"), estudianteLms);
router.get("/estudiante/prediccion", authenticate, authorize("estudiante"), estudiantePrediccion);
router.post("/estudiante/prediccion", authenticate, authorize("estudiante"), estudiantePrediccionPost);
router.get("/estudiante/alertas", authenticate, authorize("estudiante"), estudianteAlertas);
router.get("/estudiante/mensajes", authenticate, authorize("estudiante"), estudianteMensajes);

router.get("/courses", authenticate, listCourses);
router.post("/courses", authenticate, authorize("admin", "docente"), createCourse);
router.put("/courses/:id", authenticate, authorize("admin", "docente"), updateCourse);
router.delete("/courses/:id", authenticate, authorize("admin"), deleteCourse);

router.get("/matriculas", authenticate, listMatriculas);
router.get("/matriculas/stats", authenticate, matriculaStats);
router.post("/matriculas", authenticate, authorize("admin"), createMatricula);

router.post("/predict", authenticate, predict);
router.get("/predictions", authenticate, authorize("admin", "docente"), listPredictions);
router.get("/predictions/:id", authenticate, authorize("admin", "docente"), getPrediction);
router.get("/dashboard/kpis", authenticate, authorize("admin", "docente"), dashboardStats);

router.get("/alerts", authenticate, authorize("admin", "docente"), listAlerts);
router.patch("/alerts/:id", authenticate, authorize("admin", "docente"), patchAlertStatus);

router.get("/messages/rooms", authenticate, listMessageRooms);
router.get("/messages/:roomId", authenticate, listMessages);
router.patch("/messages/:roomId/read", authenticate, markRoomRead);
router.post("/messages", authenticate, sendMessage);

router.get("/notifications", authenticate, async (req, res, next) => {
  try {
    const items = await prisma.notification.findMany({
      where: { usuarioId: toDbId(req.user!.sub) },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
});
router.patch("/notifications/:id/read", authenticate, async (req, res, next) => {
  try {
    const item = await prisma.notification.updateMany({
      where: { id: paramBigIntId(req), usuarioId: toDbId(req.user!.sub) },
      data: { leida: true },
    });
    sendSuccess(res, { updated: item.count });
  } catch (e) {
    next(e);
  }
});

router.get("/ml/metrics", authenticate, authorize("admin", "docente"), async (_req, res) => {
  const metrics = await getMlMetrics();
  sendSuccess(res, { metrics: metrics ?? { message: "ML service no disponible" } });
});

router.get("/grades", authenticate, authorize("admin", "docente"), listGrades);
router.post("/grades", authenticate, authorize("admin", "docente"), createGrade);
router.delete("/grades/:id", authenticate, authorize("admin", "docente"), deleteGrade);

router.get("/attendance", authenticate, authorize("admin", "docente"), listAttendance);
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
router.get("/admin/cuentas-acceso", authenticate, authorize("admin"), exportAccessAccounts);

export default router;
