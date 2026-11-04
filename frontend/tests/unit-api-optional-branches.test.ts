import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/services/api.js";

process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1";

const requestedUrls: string[] = [];
globalThis.fetch = (async (input: string | URL | Request) => {
  requestedUrls.push(String(input));
  return new Response(JSON.stringify({ success: true, data: {} }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

test("API query builders cover empty and populated optional filters", async () => {
  requestedUrls.length = 0;
  await api.getStudents();
  await api.getStudents(2, 10, "Ana");
  await api.getTeacherAssignments();
  await api.getTeacherAssignments({});
  await api.getTeacherAssignments({ profesorId: "4", anioLectivoId: "2026" });
  await api.getSecciones();
  await api.getSecciones(0);
  await api.getSecciones(2);
  await api.getProfesorEstudiantes();
  await api.getProfesorEstudiantes(2, 10, "Luis");
  await api.getProfesorGrades();
  await api.getProfesorGrades("8", "3", 0);
  await api.getProfesorAttendance();
  await api.getProfesorAttendance("8", "2");
  await api.getProfesorAlertas();
  await api.getProfesorAlertas({ seccionId: "2", gradoId: "3", status: "nueva", riskLevel: "alto", all: true });
  await api.getGrades();
  await api.getGrades("8", "3", 0);
  await api.getPredictions();
  await api.getPredictions({ studentId: "8", page: 2, limit: 10 });

  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/students?page=1&limit=100"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/students?page=2&limit=10&q=Ana"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/teacher-assignments"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/teacher-assignments?profesorId=4&anioLectivoId=2026"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/academic/secciones"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/academic/secciones?gradoId=2"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/profesor/notas?studentId=8&courseId=3&periodoNumero=0"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/grades?studentId=8&courseId=3&periodoNumero=0"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/predictions?studentId=8&page=2&limit=10"));
});

test("API attendance, enrollment, alerts and audit filters include every supported field", async () => {
  requestedUrls.length = 0;
  await api.getAttendance();
  await api.getAttendance({
    studentId: "1", seccionId: "2", gradoId: "3", q: "Eva",
    from: "2026-01-01", to: "2026-12-31", page: 2, limit: 20,
  });
  await api.getMatriculas();
  await api.getMatriculas({ estado: "", seccionId: "2", gradoId: "3", page: 2, limit: 20, q: "Eva" });
  await api.getAlerts();
  await api.getAlerts({
    seccionId: "2", gradoId: "3", profesorId: "4", status: "nueva",
    riskLevel: "alto", all: true, search: "Eva", page: 2, limit: 20,
  });
  await api.getAuditLogs();
  await api.getAuditLogs({ page: 0, limit: 0, role: "docente", teacherId: "4", entidad: "Student" });

  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/attendance"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/attendance?studentId=1&seccionId=2&gradoId=3&q=Eva&from=2026-01-01&to=2026-12-31&page=2&limit=20"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/matriculas"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/matriculas?estado=&seccionId=2&gradoId=3&page=2&limit=20&q=Eva"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/alerts"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/alerts?seccionId=2&gradoId=3&profesorId=4&status=nueva&riskLevel=alto&all=true&search=Eva&page=2&limit=20"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/admin/audit-logs?page=1&limit=50"));
  assert.ok(requestedUrls.includes("http://localhost:4000/api/v1/admin/audit-logs?page=0&limit=0&role=docente&teacherId=4&entidad=Student"));
});
