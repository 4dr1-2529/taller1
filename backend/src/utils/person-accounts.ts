/** Correo de acceso estudiante: correo explícito o nombre.apellido + DNI. */export function buildStudentAccountEmail(
  nombres: string,
  apellidos: string,
  dni: string,
  correo?: string | null,
): string {
  if (correo?.trim()) return correo.trim().toLowerCase();

  const slug = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "");

  const base = `${slug(nombres)}.${slug(apellidos.split(" ")[0] ?? "alu")}${dni.slice(-4)}`;
  return `${base}@blenkir.edu.pe`;
}

/** Correo docente institucional pro{DNI}. */
export function buildTeacherAccountEmail(dni: string): string {
  return `pro${dni}@blenkir.edu.pe`;
}
