export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  docente: "Docente",
  tutor: "Tutor",
  psicologo: "Psicólogo",
  estudiante: "Estudiante",
  apoderado: "Apoderado",
};

export function getRoleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}
