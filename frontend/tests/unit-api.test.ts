import test from "node:test";
import assert from "node:assert/strict";

// Configurar variable de entorno antes de importar
process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1";

import { api } from "../src/services/api.js";

test("api es una instancia de ApiClient", () => {
  assert.ok(api);
  assert.strictEqual(typeof api.login, "function");
  assert.strictEqual(typeof api.refreshToken, "function");
  assert.strictEqual(typeof api.logout, "function");
  assert.strictEqual(typeof api.getMe, "function");
  assert.strictEqual(typeof api.getStudents, "function");
  assert.strictEqual(typeof api.createStudent, "function");
  assert.strictEqual(typeof api.getTeachers, "function");
  assert.strictEqual(typeof api.getCourses, "function");
  assert.strictEqual(typeof api.getGrades, "function");
  assert.strictEqual(typeof api.createGrade, "function");
  assert.strictEqual(typeof api.getAttendance, "function");
  assert.strictEqual(typeof api.createAttendance, "function");
  assert.strictEqual(typeof api.predict, "function");
  assert.strictEqual(typeof api.getPredictions, "function");
  assert.strictEqual(typeof api.getMlMetrics, "function");
  assert.strictEqual(typeof api.getAlerts, "function");
  assert.strictEqual(typeof api.getMessageRooms, "function");
  assert.strictEqual(typeof api.getMessages, "function");
  assert.strictEqual(typeof api.sendMessage, "function");
  assert.strictEqual(typeof api.getNotifications, "function");
  assert.strictEqual(typeof api.markNotificationRead, "function");
  assert.strictEqual(typeof api.getAuditLogs, "function");
  assert.strictEqual(typeof api.getSystemStats, "function");
  assert.strictEqual(typeof api.getUsers, "function");
});

test("api tiene método health", () => {
  assert.strictEqual(typeof api.health, "function");
});

test("api tiene método getMatriculas", () => {
  assert.strictEqual(typeof api.getMatriculas, "function");
});

test("api tiene método createMatricula", () => {
  assert.strictEqual(typeof api.createMatricula, "function");
});

test("api tiene método getMatriculaStats", () => {
  assert.strictEqual(typeof api.getMatriculaStats, "function");
});

test("api tiene método updateMatriculaState", () => {
  assert.strictEqual(typeof api.updateMatriculaState, "function");
});

test("api tiene método getAniosLectivos", () => {
  assert.strictEqual(typeof api.getAniosLectivos, "function");
});

test("api tiene método getProfesorCursos", () => {
  assert.strictEqual(typeof api.getProfesorCursos, "function");
});

test("api tiene método getProfesorSecciones", () => {
  assert.strictEqual(typeof api.getProfesorSecciones, "function");
});

test("api tiene método getProfesorEstudiantes", () => {
  assert.strictEqual(typeof api.getProfesorEstudiantes, "function");
});

test("api tiene método getProfesorGrades", () => {
  assert.strictEqual(typeof api.getProfesorGrades, "function");
});

test("api tiene método getProfesorAttendance", () => {
  assert.strictEqual(typeof api.getProfesorAttendance, "function");
});

test("api tiene método getProfesorAlertas", () => {
  assert.strictEqual(typeof api.getProfesorAlertas, "function");
});

test("api tiene método updateCourse", () => {
  assert.strictEqual(typeof api.updateCourse, "function");
});

test("api tiene método deleteCourse", () => {
  assert.strictEqual(typeof api.deleteCourse, "function");
});

test("api tiene método reassignCourse", () => {
  assert.strictEqual(typeof api.reassignCourse, "function");
});
