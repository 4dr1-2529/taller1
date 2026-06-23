/**
 * Seed demo — asignación docente institucional
 * 1°–2°: un tutor dicta todos los cursos del aula
 * 3°–6°: polidocencia — 2 cursos por docente, máx. 6 salones distintos
 */
import type { PrismaClient } from "@prisma/client";
import { assignTutorToSection, createCourseAssignment } from "../src/services/teacher-assignment.service.js";
import {
  MAX_POLIDOCENCIA_SECTIONS,
  TEACHER_COURSE_PAIRS,
} from "./demo-data/teacher-course-pairs.js";

type SeccionRow = {
  id: bigint;
  nombre: string;
  gradoId: bigint;
  grado: { numero: number };
};

type PoliSlot = {
  seccionId: bigint;
  cursoId: bigint;
  cursoCodigo: string;
  gradoNumero: number;
  key: string;
};

type TeacherPoliState = {
  profesorId: bigint;
  courseCodes: readonly [string, string];
  sectionIds: Set<string>;
  load: number;
};

async function tryAssign(
  teacher: TeacherPoliState,
  slot: PoliSlot,
  anioLectivoId: bigint,
  assignedKeys: Set<string>,
): Promise<boolean> {
  if (assignedKeys.has(slot.key)) return true;
  try {
    await createCourseAssignment({
      profesorId: String(teacher.profesorId),
      cursoId: String(slot.cursoId),
      seccionId: String(slot.seccionId),
      anioLectivoId: String(anioLectivoId),
      esTutor: false,
    });
    teacher.sectionIds.add(String(slot.seccionId));
    teacher.load++;
    assignedKeys.add(slot.key);
    return true;
  } catch {
    return false;
  }
}

export async function seedTeacherAssignments(
  prisma: PrismaClient,
  teacherIds: bigint[],
  secciones: SeccionRow[],
  anioLectivoId: bigint,
) {
  console.log("  Asignaciones docentes (tutor 1°-2°, polidocencia 3°-6°)…");

  const seccionesTutor = secciones
    .filter((s) => s.grado.numero <= 2)
    .sort((a, b) => a.grado.numero - b.grado.numero || a.nombre.localeCompare(b.nombre));

  for (let i = 0; i < seccionesTutor.length; i++) {
    const sec = seccionesTutor[i]!;
    await assignTutorToSection({
      profesorId: String(teacherIds[i % teacherIds.length]!),
      seccionId: String(sec.id),
      anioLectivoId: String(anioLectivoId),
    });
  }

  const seccionesPoli = secciones
    .filter((s) => s.grado.numero >= 3)
    .sort((a, b) => a.grado.numero - b.grado.numero || a.nombre.localeCompare(b.nombre));

  const cursosPorGrado = new Map<string, { cursoId: bigint; codigo: string }[]>();
  for (const sec of seccionesPoli) {
    const key = String(sec.gradoId);
    if (cursosPorGrado.has(key)) continue;
    const rows = await prisma.cursoGrado.findMany({
      where: { gradoId: sec.gradoId },
      include: { curso: { select: { id: true, codigo: true } } },
    });
    cursosPorGrado.set(
      key,
      rows.map((r) => ({ cursoId: r.cursoId, codigo: r.curso.codigo })),
    );
  }

  const slots: PoliSlot[] = [];
  for (const sec of seccionesPoli) {
    for (const curso of cursosPorGrado.get(String(sec.gradoId)) ?? []) {
      slots.push({
        seccionId: sec.id,
        cursoId: curso.cursoId,
        cursoCodigo: curso.codigo,
        gradoNumero: sec.grado.numero,
        key: `${sec.id}:${curso.cursoId}`,
      });
    }
  }

  const states: TeacherPoliState[] = teacherIds.map((profesorId, idx) => ({
    profesorId,
    courseCodes: TEACHER_COURSE_PAIRS[idx] ?? TEACHER_COURSE_PAIRS[idx % TEACHER_COURSE_PAIRS.length]!,
    sectionIds: new Set<string>(),
    load: 0,
  }));

  const assignedKeys = new Set<string>();

  // Fase 1: repartir salones base entre docentes (máx. 6) y dictar sus 2 cursos ahí
  let sectionCursor = 0;
  for (const teacher of states) {
    while (teacher.sectionIds.size < MAX_POLIDOCENCIA_SECTIONS && sectionCursor < seccionesPoli.length) {
      teacher.sectionIds.add(String(seccionesPoli[sectionCursor]!.id));
      sectionCursor++;
    }
    for (const secId of teacher.sectionIds) {
      const sec = seccionesPoli.find((s) => String(s.id) === secId);
      if (!sec) continue;
      const cursos = cursosPorGrado.get(String(sec.gradoId)) ?? [];
      for (const code of teacher.courseCodes) {
        const curso = cursos.find((c) => c.codigo === code);
        if (!curso) continue;
        const slot: PoliSlot = {
          seccionId: sec.id,
          cursoId: curso.cursoId,
          cursoCodigo: code,
          gradoNumero: sec.grado.numero,
          key: `${sec.id}:${curso.cursoId}`,
        };
        await tryAssign(teacher, slot, anioLectivoId, assignedKeys);
      }
    }
  }

  // Fase 2: completar huecos con docentes que tengan cupo
  for (const slot of slots) {
    if (assignedKeys.has(slot.key)) continue;
    const secKey = String(slot.seccionId);
    const candidates = states
      .filter((t) => {
        if (!t.courseCodes.includes(slot.cursoCodigo)) return false;
        if (t.sectionIds.has(secKey)) return true;
        return t.sectionIds.size < MAX_POLIDOCENCIA_SECTIONS;
      })
      .sort((a, b) => {
        const aHas = a.sectionIds.has(secKey) ? 0 : 1;
        const bHas = b.sectionIds.has(secKey) ? 0 : 1;
        if (aHas !== bHas) return aHas - bHas;
        return a.load - b.load;
      });

    for (const teacher of candidates) {
      if (await tryAssign(teacher, slot, anioLectivoId, assignedKeys)) break;
    }
  }

  const assigned = assignedKeys.size;
  const skipped = slots.length - assigned;
  console.log(
    `  Polidocencia: ${assigned}/${slots.length} asignaciones · ${skipped} omitidas · máx ${MAX_POLIDOCENCIA_SECTIONS} salones/docente`,
  );
}
