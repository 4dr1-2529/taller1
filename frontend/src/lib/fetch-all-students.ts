import { api } from "@/services/api";
import { mapStudentFromApi } from "@/lib/api-mappers";
import type { Student } from "@/types/academic";

/** Carga todos los estudiantes paginando la API (evita límite de 200 en listados por salón). */
export async function fetchAllStudents(asProfesor = false): Promise<Student[]> {
  const limit = 200;
  const fetchPage = asProfesor
    ? (page: number, lim: number, q?: string) => api.getProfesorEstudiantes(page, lim, q)
    : (page: number, lim: number, q?: string) => api.getStudents(page, lim, q);
  const first = await fetchPage(1, limit);
  const all = first.items.map((r) =>
    mapStudentFromApi(r as Parameters<typeof mapStudentFromApi>[0]),
  );
  for (let page = 2; page <= first.pages; page++) {
    const res = await fetchPage(page, limit);
    all.push(...res.items.map((r) => mapStudentFromApi(r as Parameters<typeof mapStudentFromApi>[0])));
  }
  return all;
}
