export const ROLE_LABEL: Record<string, string> = {
  admin: "Director",
  docente: "Profesor",
  estudiante: "Estudiante",
};

export function getRoleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}
