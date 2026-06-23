/**
 * Seed demo — asignación docente institucional (tutor 1°-2°, polidocencia 3°-6°)
 */
import type { PrismaClient } from "@prisma/client";
import { assignTutorToSection, createCourseAssignment } from "../src/services/teacher-assignment.service.js";

type SeccionRow = {
  id: bigint;
  nombre: string;
  gradoId: bigint;
  grado: { numero: number };
};

/** Docente por curso: índice en PROFESORES → códigos de catálogo (1-2 cursos). */
const POLIDOCENCIA: { teacherIdx: number; cursos: string[] }[] = [
  { teacherIdx: 0, cursos: ["ING"] },
  { teacherIdx: 1, cursos: ["PDT", "GRA"] },
  { teacherIdx: 2, cursos: ["CUH", "MUF"] },
  { teacherIdx: 3, cursos: ["CIU", "GEG"] },
  { teacherIdx: 4, cursos: ["ING"] },
  { teacherIdx: 5, cursos: ["EDF"] },
  { teacherIdx: 6, cursos: ["ARI", "ALG"] },
  { teacherIdx: 7, cursos: ["RZV", "GRA"] },
  { teacherIdx: 8, cursos: ["REL"] },
  { teacherIdx: 9, cursos: ["TAL"] },
  { teacherIdx: 10, cursos: ["GEG", "HIS"] },
  { teacherIdx: 11, cursos: ["HIS", "CIU"] },
  { teacherIdx: 12, cursos: ["RZM", "RZV"] },
  { teacherIdx: 13, cursos: ["GEO"] },
  { teacherIdx: 14, cursos: ["ALG", "ARI"] },
];

export async function seedTeacherAssignments(
  prisma: PrismaClient,
  teacherIds: bigint[],
  secciones: SeccionRow[],
  anioLectivoId: bigint,
) {
  console.log("  Asignaciones docentes (tutor 1°-2°, polidocencia 3°-6°)…");

  const catalog = await prisma.cursoCatalogo.findMany({ select: { id: true, codigo: true } });
  const catalogByCode = new Map(catalog.map((c) => [c.codigo, c.id]));

  let tutorIdx = 0;
  for (const sec of secciones) {
    if (sec.grado.numero <= 2) {
      const profesorId = teacherIds[tutorIdx % teacherIds.length]!;
      tutorIdx++;
      await assignTutorToSection({
        profesorId: String(profesorId),
        seccionId: String(sec.id),
        anioLectivoId: String(anioLectivoId),
      });
    }
  }

  const seccionesPoli = secciones.filter((s) => s.grado.numero >= 3);
  for (const cfg of POLIDOCENCIA) {
    const profesorId = teacherIds[cfg.teacherIdx];
    if (!profesorId) continue;
    for (const codigo of cfg.cursos) {
      const cursoId = catalogByCode.get(codigo);
      if (!cursoId) continue;
      for (const sec of seccionesPoli) {
        const cursosGrado = await prisma.cursoGrado.findFirst({
          where: { gradoId: sec.gradoId, cursoId },
        });
        if (!cursosGrado) continue;
        try {
          await createCourseAssignment({
            profesorId: String(profesorId),
            cursoId: String(cursoId),
            seccionId: String(sec.id),
            anioLectivoId: String(anioLectivoId),
            esTutor: false,
          });
        } catch {
          // conflicto por uk_asig_cur_sec_anio — otro docente ya asignado; omitir
        }
      }
    }
  }
}
