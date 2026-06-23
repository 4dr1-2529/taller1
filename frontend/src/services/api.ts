import { requireApiBaseUrl } from "@/lib/api-base";

export type AuthUser = {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  role: "admin" | "docente" | "estudiante";
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

export type ApiPredictionResult = {
  id?: string;
  studentId?: string;
  score: number;
  level: "bajo" | "medio" | "alto";
  probability: number;
  probabilityAbandono?: number;
  factors: { key: string; label: string; contribution: number }[];
  modelName: string;
  recommendation: string;
  predictedAt: string;
  inputData?: Record<string, unknown>;
  /** Formato tesis */
  probabilidad_abandono?: number;
  score_predictivo?: number;
  nivel_riesgo?: string;
  factores_riesgo?: { key: string; label: string; contribution: number }[];
  recomendacion?: string;
  modelo_usado?: string;
  fecha_prediccion?: string;
  datos_ingresados?: Record<string, unknown>;
};

export type ApiPredictionHistoryItem = Prediction & {
  factors: { key: string; label: string; contribution: number }[];
  meta?: {
    recommendation?: string;
    inputData?: Record<string, unknown>;
    source?: string;
  } | null;
  student?: { id: string; codigo: string; nombres: string; apellidos: string };
};

export type Alert = {
  id: string;
  studentId: string;
  titulo: string;
  descripcion: string;
  factorKey: string | null;
  level: "bajo" | "medio" | "alto";
  status: "nueva" | "en_seguimiento" | "resuelta";
  score?: number | null;
  probability?: number | null;
  factorsJson?: string | null;
  recommendation?: string | null;
  nivel_riesgo?: string;
  estado_label?: string;
  factores_riesgo?: { key: string; label: string; contribution: number }[];
  fecha?: string;
  createdAt: string;
  student: { id: string; nombres: string; apellidos: string; codigo: string };
  curso?: { id: string; nombre: string } | null;
  profesor?: string | null;
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

export type TeacherAssignment = {
  id: string;
  profesorId: string;
  cursoId: string;
  gradoId: string;
  seccionId: string;
  anioLectivoId: string;
  cursoOfertaId: string | null;
  esTutor: boolean;
  activo: boolean;
  tipoAsignacion: string;
  curso?: { id: string; codigo: string; nombre: string };
  grado?: { id: string; numero: number; nombre: string; label: string };
  seccion?: { id: string; nombre: string; label: string };
  profesor?: { id: string; codigo: string; nombres: string; apellidos: string; nombre: string };
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

export type MatriculaRow = {
  id: string;
  codigo: string;
  estado: string;
  fechaMatricula: string;
  estudianteId: string;
  seccionId: string;
  anioLectivoId: string;
  estudiante: { id: string; codigo: string; nombres: string; apellidos: string; seccionId: string | null };
  seccion: { id: string; nombre: string; gradoNumero: number; gradoNombre: string; nivel: string; label: string };
  anioLectivo: { id: string; anio: number; nombre: string };
};

export type AcademicMessage = {
  id: string;
  roomId: string;
  scope?: string;
  remitente?: { id: string; nombre: string; rol: string };
  destinatarioId?: string | null;
  contenido: string;
  fecha?: string;
  leida?: boolean;
  readAt?: string | null;
  createdAt?: string;
};

export type MessageRoom = {
  roomId: string;
  label: string;
  scope: "global" | "profesores" | "curso" | "directo";
};

export type ApiNotification = {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
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
  usuario?: {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    role: string;
  } | null;
  teacher?: {
    id: string;
    codigo: string;
    nombres: string;
    apellidos: string;
    correo: string;
  } | null;
  student?: { nombres: string; apellidos: string; codigo: string };
};

export type FieldError = { field: string; message: string };

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: FieldError[] | string[];
};

export type ApiResponse<T> = T;

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  get hasToken() {
    return !!this.token;
  }

  /** Llamadas autenticadas (p. ej. módulo profesor). */
  async call<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(path, options);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${requireApiBaseUrl()}${path}`, { ...options, headers });
    const body = (await res.json()) as ApiEnvelope<T> & Record<string, unknown>;

    if (!res.ok || body.success === false) {
      const msg = body.message ?? (body.error as string) ?? "Error de API";
      const errs = body.errors ?? [];
      const detail = errs
        .map((e) => (typeof e === "string" ? e : `${e.field}: ${e.message}`))
        .join("; ");
      throw new Error(detail ? `${msg}: ${detail}` : msg);
    }

    if (body.success === true && body.data !== undefined) {
      return body.data as T;
    }

    const legacy = { ...(body as Record<string, unknown>) };
    delete legacy.success;
    delete legacy.message;
    delete legacy.data;
    delete legacy.errors;
    delete legacy.ok;
    return legacy as T;
  }

  async health() {
    return this.request<{ service: string; version: string }>("/health");
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

  async getTeacherDetail(id: string) {
    return this.request<{
      teacher: Teacher;
      workload: {
        tipoAsignacion: string;
        esTutor: boolean;
        cursos: { id: string; nombre: string; codigo: string }[];
        grados: string[];
        secciones: string[];
        cargaAcademica: number;
        totalAlumnos: number;
        polidocencia?: {
          cursosDistintos: number;
          maxCursos: number;
          salonesDistintos: number;
          maxSalones: number;
        };
        asignaciones: { curso: string; salon: string; esTutor: boolean }[];
      };
    }>(`/teachers/${id}/detail`);
  }

  async getTeacherAssignments(params?: Record<string, string>) {
    const q = new URLSearchParams(params);
    const suffix = q.toString() ? `?${q}` : "";
    return this.request<{ items: TeacherAssignment[]; total: number }>(`/teacher-assignments${suffix}`);
  }

  async createTeacherAssignment(payload: {
    profesorId: string;
    cursoId: string;
    seccionId: string;
    anioLectivoId?: string;
    esTutor?: boolean;
  }) {
    return this.request<{ item: TeacherAssignment }>("/teacher-assignments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createTutorAssignment(payload: { profesorId: string; seccionId: string; anioLectivoId?: string }) {
    return this.request<{ tutor: boolean; totalCursos: number; seccionId: string }>(
      "/teacher-assignments/tutor",
      { method: "POST", body: JSON.stringify(payload) },
    );
  }

  async deactivateTeacherAssignment(id: string) {
    return this.request<{ id: string; activo: boolean }>(`/teacher-assignments/${id}/deactivate`, {
      method: "PATCH",
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

  async getProfesorCursos() {
    return this.request<{ items: Course[] }>("/profesor/mis-cursos");
  }

  async getProfesorSecciones() {
    return this.request<{ items: ApiSeccion[] }>("/profesor/mis-secciones");
  }

  async getProfesorEstudiantes(page = 1, limit = 100, q = "") {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    return this.request<{ items: Student[]; total: number; page: number; pages: number }>(
      `/profesor/mis-estudiantes?${params}`,
    );
  }

  async getProfesorGrades(studentId?: string, courseId?: string, periodoNumero?: number) {
    const params = new URLSearchParams();
    if (studentId) params.set("studentId", studentId);
    if (courseId) params.set("courseId", courseId);
    if (periodoNumero != null) params.set("periodoNumero", String(periodoNumero));
    const q = params.toString() ? `?${params}` : "";
    return this.request<{ items: unknown[] }>(`/profesor/notas${q}`);
  }

  async getProfesorAttendance(studentId?: string, seccionId?: string) {
    const params = new URLSearchParams();
    if (studentId) params.set("studentId", studentId);
    if (seccionId) params.set("seccionId", seccionId);
    const q = params.toString() ? `?${params}` : "";
    return this.request<{ items: unknown[] }>(`/profesor/asistencia${q}`);
  }

  async getProfesorAlertas(params?: {
    seccionId?: string;
    gradoId?: string;
    status?: string;
    riskLevel?: string;
    all?: boolean;
  }) {
    const q = new URLSearchParams();
    if (params?.seccionId) q.set("seccionId", params.seccionId);
    if (params?.gradoId) q.set("gradoId", params.gradoId);
    if (params?.status) q.set("status", params.status);
    if (params?.riskLevel) q.set("riskLevel", params.riskLevel);
    if (params?.all) q.set("all", "true");
    const query = q.toString() ? `?${q}` : "";
    return this.request<{ items: Alert[]; total: number; salonSummary?: { salon: string; count: number }[] }>(
      `/profesor/alertas${query}`,
    );
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

  async getMatriculas(params?: {
    seccionId?: string;
    page?: number;
    limit?: number;
    estado?: string;
  }) {
    const q = new URLSearchParams({ estado: params?.estado ?? "activa" });
    if (params?.seccionId) q.set("seccionId", params.seccionId);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const query = q.toString() ? `?${q}` : "";
    return this.request<{
      items: MatriculaRow[];
      total: number;
      page: number;
      pages: number;
      activas: number;
    }>(`/matriculas${query}`);
  }

  async getMatriculaStats() {
    return this.request<{
      matriculasActivas: number;
      matriculasAnioLectivo: number;
      estudiantesActivos: number;
      anioLectivo: string | null;
    }>("/matriculas/stats");
  }

  async createMatricula(payload: {
    estudianteId: string;
    seccionId: string;
    anioLectivoId: string;
    codigo?: string;
    fechaMatricula?: string;
  }) {
    return this.request<{ item: MatriculaRow }>("/matriculas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAniosLectivos() {
    return this.request<{ items: { id: string; anio: number; nombre: string; activo: boolean }[] }>(
      "/academic/anios-lectivos",
    );
  }

  async getGrades(studentId?: string, courseId?: string, periodoNumero?: number) {
    const params = new URLSearchParams();
    if (studentId) params.set("studentId", studentId);
    if (courseId) params.set("courseId", courseId);
    if (periodoNumero != null) params.set("periodoNumero", String(periodoNumero));
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

  async bulkAttendance(payload: {
    fecha: string;
    records: {
      studentId: string;
      presente: boolean;
      justificado: boolean;
      tardanza: boolean;
      observacion?: string;
    }[];
  }) {
    return this.request<{ upserted: number; fecha: string }>("/attendance/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getDashboardKpis() {
    return this.request<{
      kpis: {
        totalStudents: number;
        totalTeachers?: number;
        totalSalones?: number;
        openAlerts: number;
        avgRisk: number;
        avgGrade?: number;
        avgAttendance?: number;
        byLevel: { bajo: number; medio: number; alto: number };
        alertsByLevel?: Record<string, number>;
        institutionName?: string;
        directorName?: string | null;
        directorEmail?: string | null;
      };
      riskTrend: { periodo: string; riesgoGlobal: number; count?: number }[];
      riskBySection: { label: string; alto: number; medio: number; bajo: number; total: number }[];
      riskByGrado?: { grado: string; alto: number; medio: number; bajo: number }[];
      attendanceByGrado?: { grado: string; asistencia: number }[];
      lmsActivityByGrado?: { grado: string; alta: number; media: number; baja: number; sin: number }[];
      alertsBySalonShort?: { salon: string; count: number }[];
      modelComparison: { modelo: string; f1: number; accuracy: number }[];
      featureImportance: { variable: string; peso: number }[];
    }>("/dashboard/kpis");
  }

  async predict(studentId: string, metrics?: Record<string, unknown>) {
    return this.request<{
      prediction: ApiPredictionResult;
      source: string;
      alert?: Alert | null;
    }>("/predict", {
      method: "POST",
      body: JSON.stringify({ studentId, metrics }),
    });
  }

  async getPredictions(params?: { studentId?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.studentId) q.set("studentId", params.studentId);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const query = q.toString() ? `?${q}` : "";
    return this.request<{
      items: ApiPredictionHistoryItem[];
      total: number;
      page: number;
      pages: number;
    }>(`/predictions${query}`);
  }

  async getMlMetrics() {
    return this.request<{ metrics: unknown }>("/ml/metrics");
  }

  async getAlerts(params?: {
    seccionId?: string;
    gradoId?: string;
    profesorId?: string;
    status?: string;
    riskLevel?: string;
    all?: boolean;
  }) {
    const q = new URLSearchParams();
    if (params?.seccionId) q.set("seccionId", params.seccionId);
    if (params?.gradoId) q.set("gradoId", params.gradoId);
    if (params?.profesorId) q.set("profesorId", params.profesorId);
    if (params?.status) q.set("status", params.status);
    if (params?.riskLevel) q.set("riskLevel", params.riskLevel);
    if (params?.all) q.set("all", "true");
    const query = q.toString() ? `?${q}` : "";
    return this.request<{
      items: Alert[];
      total?: number;
      salonSummary?: { salon: string; count: number }[];
    }>(`/alerts${query}`);
  }

  async updateAlertStatus(id: string, status: "nueva" | "en_seguimiento" | "resuelta") {
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

  async getMessageRooms() {
    return this.request<{ rooms: MessageRoom[] }>("/messages/rooms");
  }

  async getMessages(roomId: string) {
    return this.request<{ items: AcademicMessage[] }>(`/messages/${encodeURIComponent(roomId)}`);
  }

  async sendMessage(payload: {
    roomId?: string;
    contenido: string;
    scope?: MessageRoom["scope"];
    recipientUserId?: string;
    courseId?: string;
    parentMessageId?: string;
  }) {
    return this.request<{ message: AcademicMessage }>("/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async markMessagesRead(roomId: string) {
    return this.request<{ marked: number }>(`/messages/${encodeURIComponent(roomId)}/read`, {
      method: "PATCH",
    });
  }

  async getAuditLogs(params?: { page?: number; limit?: number; role?: string; teacherId?: string; entidad?: string }) {
    const q = new URLSearchParams();
    q.set("page", String(params?.page ?? 1));
    q.set("limit", String(params?.limit ?? 50));
    if (params?.role) q.set("role", params.role);
    if (params?.teacherId) q.set("teacherId", params.teacherId);
    if (params?.entidad) q.set("entidad", params.entidad);
    return this.request<{ items: AuditLog[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/admin/audit-logs?${q.toString()}`,
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
