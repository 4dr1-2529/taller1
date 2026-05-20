const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type AuthUser = {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  role: "admin" | "docente" | "tutor" | "psicologo" | "estudiante" | "apoderado";
  teacherId?: string | null;
};

export type ApiSeccion = {
  id: string;
  nombre: string;
  capacidad: number;
  grado: {
    id: number;
    numero: number;
    nombre: string;
    nivel: { id: number; codigo: string; nombre: string };
  };
};

export type ApiNivel = {
  id: number;
  codigo: string;
  nombre: string;
  grados: { id: number; numero: number; nombre: string; secciones: { id: string; nombre: string }[] }[];
};

export type Student = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  correo: string;
  telefono: string | null;
  estado: "activo" | "en_riesgo" | "retirado";
  promedioGeneral: number;
  asistenciaGeneral: number;
  lmsEngagement: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  lmsActivities: LmsActivity[];
  predictions?: Prediction[];
  alerts?: Alert[];
};

export type LmsActivity = {
  id: string;
  studentId: string;
  semana: string;
  actividadPct: number;
  minutos: number;
  tareasEntregadas: number;
  tareasTotales: number;
  horasPlataforma: number;
  createdAt: string;
};

export type Prediction = {
  id: string;
  studentId: string;
  score: number;
  level: "bajo" | "medio" | "alto";
  probability: number | null;
  modelVersion: string;
  modelName: string;
  factorsJson: string;
  createdAt: string;
};

export type Alert = {
  id: string;
  studentId: string;
  titulo: string;
  descripcion: string;
  factorKey: string | null;
  level: "bajo" | "medio" | "alto";
  status: "abierta" | "en_seguimiento" | "resuelta";
  createdAt: string;
  student: { id: string; nombres: string; apellidos: string; codigo: string };
};

export type Teacher = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string | null;
  activo: boolean;
};

export type Course = {
  id: string;
  codigo: string;
  nombre: string;
  nivel: string;
  profesorId: string;
  activo: boolean;
  profesor?: { nombres: string; apellidos: string };
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  periodo: string;
  student?: Student;
  course?: Course;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  contenido: string;
  createdAt: string;
};

export type ApiNotification = {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
};

export type ApiPsychFollowUp = {
  id: string;
  studentId: string;
  fecha: string;
  resumen: string;
  acciones: string | null;
  profesional: string | null;
  student: { id: string; nombres: string; apellidos: string; codigo: string };
};

export type AuditLog = {
  id: string;
  entidad: string;
  entidadId: string | null;
  accion: string;
  usuarioId: string | null;
  detalle: string | null;
  ipAddress: string | null;
  createdAt: string;
  student?: { nombres: string; apellidos: string; codigo: string };
};

export type ApiResponse<T> = { ok: boolean } & T;

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  get hasToken() {
    return !!this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error de API");
    return data as ApiResponse<T>;
  }

  async health() {
    return this.request<{ ok: boolean }>("/health");
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; refreshToken?: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ token: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getMe() {
    return this.request<{ user: AuthUser }>("/auth/me");
  }

  async getStudents(page = 1, limit = 100, q = "") {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    return this.request<{ items: Student[]; total: number; page: number; pages: number }>(`/students?${params}`);
  }

  async createStudent(payload: Record<string, unknown>) {
    return this.request<{ student: Student }>("/students", { method: "POST", body: JSON.stringify(payload) });
  }

  async updateStudent(id: string, payload: Record<string, unknown>) {
    return this.request<{ student: Student }>(`/students/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  }

  async deleteStudent(id: string) {
    return this.request<{ ok: boolean }>(`/students/${id}`, { method: "DELETE" });
  }

  async getTeachers() {
    return this.request<{ items: Teacher[] }>("/teachers");
  }

  async createTeacher(payload: Record<string, unknown>) {
    return this.request<{ teacher: Teacher }>("/teachers", { method: "POST", body: JSON.stringify(payload) });
  }

  async updateTeacher(id: string, payload: Record<string, unknown>) {
    return this.request<{ teacher: Teacher }>(`/teachers/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  }

  async deleteTeacher(id: string) {
    return this.request<{ ok: boolean }>(`/teachers/${id}`, { method: "DELETE" });
  }

  async createTeacherAccount(id: string, password: string) {
    return this.request<{ teacher: Teacher }>(`/teachers/${id}/account`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async getNiveles() {
    return this.request<{ items: ApiNivel[] }>("/academic/niveles");
  }

  async getSecciones(gradoId?: number) {
    const q = gradoId ? `?gradoId=${gradoId}` : "";
    return this.request<{ items: ApiSeccion[] }>(`/academic/secciones${q}`);
  }

  async getCursosCatalogo() {
    return this.request<{ items: { id: string; codigo: string; nombre: string; area: string }[] }>(
      "/academic/cursos-catalogo",
    );
  }

  async getCourses() {
    return this.request<{ items: Course[] }>("/courses");
  }

  async createCourse(payload: Record<string, unknown>) {
    return this.request<{ course: Course }>("/courses", { method: "POST", body: JSON.stringify(payload) });
  }

  async updateCourse(id: string, payload: Record<string, unknown>) {
    return this.request<{ course: Course }>(`/courses/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  }

  async deleteCourse(id: string) {
    return this.request<{ ok: boolean }>(`/courses/${id}`, { method: "DELETE" });
  }

  async getEnrollments() {
    return this.request<{ items: Enrollment[] }>("/enrollments");
  }

  async createEnrollment(payload: Record<string, unknown>) {
    return this.request<{ item: Enrollment }>("/enrollments", { method: "POST", body: JSON.stringify(payload) });
  }

  async getGrades(studentId?: string, courseId?: string) {
    const params = new URLSearchParams();
    if (studentId) params.set("studentId", studentId);
    if (courseId) params.set("courseId", courseId);
    const q = params.toString() ? `?${params}` : "";
    return this.request<{ items: unknown[] }>(`/grades${q}`);
  }

  async createGrade(payload: Record<string, unknown>) {
    return this.request<{ item: unknown }>("/grades", { method: "POST", body: JSON.stringify(payload) });
  }

  async getAttendance(studentId?: string) {
    const q = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return this.request<{ items: unknown[] }>(`/attendance${q}`);
  }

  async createAttendance(payload: Record<string, unknown>) {
    return this.request<{ record: unknown }>("/attendance", { method: "POST", body: JSON.stringify(payload) });
  }

  async getDashboardKpis() {
    return this.request<{ kpis: Record<string, unknown> }>("/dashboard/kpis");
  }

  async predict(studentId: string) {
    return this.request<{ prediction: unknown; source: string }>("/predict", {
      method: "POST",
      body: JSON.stringify({ studentId }),
    });
  }

  async getMlMetrics() {
    return this.request<{ metrics: unknown }>("/ml/metrics");
  }

  async getAlerts() {
    return this.request<{ items: Alert[] }>("/alerts");
  }

  async updateAlertStatus(id: string, status: "abierta" | "en_seguimiento" | "resuelta") {
    return this.request<{ item: Alert }>(`/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async getNotifications() {
    return this.request<{ items: ApiNotification[] }>("/notifications");
  }

  async markNotificationRead(id: string) {
    return this.request<{ updated: number }>(`/notifications/${id}/read`, { method: "PATCH" });
  }

  async getPsychFollowUps(studentId?: string) {
    const q = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return this.request<{ items: ApiPsychFollowUp[] }>(`/psych-followups${q}`);
  }

  async createPsychFollowUp(payload: { studentId: string; resumen: string; acciones?: string; profesional?: string }) {
    return this.request<{ item: ApiPsychFollowUp }>("/psych-followups", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getChatMessages(roomId: string) {
    return this.request<{ items: ChatMessage[] }>(`/chat/${encodeURIComponent(roomId)}`);
  }

  async sendChat(roomId: string, contenido: string) {
    return this.request<{ message: ChatMessage }>("/chat", {
      method: "POST",
      body: JSON.stringify({ roomId, contenido }),
    });
  }

  async getAuditLogs(page = 1, limit = 50) {
    return this.request<{ items: AuditLog[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/admin/audit-logs?page=${page}&limit=${limit}`,
    );
  }

  async getSystemStats() {
    return this.request<{ stats: Record<string, number> }>("/admin/system-stats");
  }

  async getUsers() {
    return this.request<{ items: AuthUser[] }>("/admin/users");
  }

  async createUser(payload: Record<string, unknown>) {
    return this.request<{ user: AuthUser }>("/admin/users", { method: "POST", body: JSON.stringify(payload) });
  }

  async updateUser(id: string, payload: Record<string, unknown>) {
    return this.request<{ user: AuthUser }>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  }

  async deleteUser(id: string) {
    return this.request<{ ok: boolean }>(`/admin/users/${id}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
