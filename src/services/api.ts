const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type AuthUser = {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  role: string;
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

export type ApiAlert = {
  id: string;
  titulo: string;
  descripcion: string;
  factorKey: string | null;
  level: string;
  status: string;
  createdAt: string;
  student: {
    id: string;
    nombres: string;
    apellidos: string;
    codigo: string;
  };
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

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  get hasToken() {
    return !!this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error de API");
    return data as T;
  }

  async health() {
    return this.request<{ ok: boolean }>("/health");
  }

  async login(email: string, password: string) {
    return this.request<{ ok: boolean; token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getStudents(limit = 100) {
    return this.request<{ ok: boolean; items: unknown[] }>(`/students?limit=${limit}`);
  }

  async createStudent(payload: Record<string, unknown>) {
    return this.request<{ ok: boolean; student: unknown }>("/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getTeachers() {
    return this.request<{ ok: boolean; items: unknown[] }>("/teachers");
  }

  async getCourses() {
    return this.request<{ ok: boolean; items: unknown[] }>("/courses");
  }

  async getEnrollments() {
    return this.request<{ ok: boolean; items: unknown[] }>("/enrollments");
  }

  async createEnrollment(payload: Record<string, unknown>) {
    return this.request<{ ok: boolean; item: unknown }>("/enrollments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getDashboardKpis() {
    return this.request<{ ok: boolean; kpis: Record<string, unknown> }>("/dashboard/kpis");
  }

  async predict(studentId: string) {
    return this.request<{ ok: boolean; prediction: unknown; source: string }>("/predict", {
      method: "POST",
      body: JSON.stringify({ studentId }),
    });
  }

  async getMlMetrics() {
    return this.request<{ ok: boolean; metrics: unknown }>("/ml/metrics");
  }

  async getAlerts() {
    return this.request<{ ok: boolean; items: ApiAlert[] }>("/alerts");
  }

  async updateAlertStatus(id: string, status: "abierta" | "en_seguimiento" | "resuelta") {
    return this.request<{ ok: boolean; item: ApiAlert }>(`/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async getNotifications() {
    return this.request<{ ok: boolean; items: ApiNotification[] }>("/notifications");
  }

  async markNotificationRead(id: string) {
    return this.request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "PATCH" });
  }

  async getPsychFollowUps(studentId?: string) {
    const q = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return this.request<{ ok: boolean; items: ApiPsychFollowUp[] }>(`/psych-followups${q}`);
  }

  async createPsychFollowUp(payload: {
    studentId: string;
    resumen: string;
    acciones?: string;
    profesional?: string;
  }) {
    return this.request<{ ok: boolean; item: ApiPsychFollowUp }>("/psych-followups", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getChatMessages(roomId: string) {
    return this.request<{ ok: boolean; items: ChatMessage[] }>(
      `/chat/${encodeURIComponent(roomId)}`,
    );
  }

  async sendChat(roomId: string, contenido: string) {
    return this.request<{ ok: boolean; message: ChatMessage }>("/chat", {
      method: "POST",
      body: JSON.stringify({ roomId, contenido }),
    });
  }
}

export const api = new ApiClient();
