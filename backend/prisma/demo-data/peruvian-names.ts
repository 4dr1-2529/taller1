import { randomInt } from "node:crypto";
export const PERUVIAN_FIRST_NAMES = [
  "Mateo", "Valentina", "Santiago", "Luciana", "Sebastián", "Camila", "Diego", "Isabella",
  "Alejandro", "Sofía", "Daniel", "Mariana", "Andrés", "Emilia", "Gabriel", "Victoria",
  "Renato", "Fiorella", "Bruno", "Ariana", "Joaquín", "Mía", "Thiago", "Antonella",
  "Ian", "Lucía", "Adrián", "Valeria", "Emilio", "Nicole", "Rodrigo", "Paola",
  "César", "Milagros", "Eduardo", "Roxana", "Julio", "Katherine", "Marco", "Angela",
  "Felipe", "Ruth", "Héctor", "Gladys", "Óscar", "Patricia", "Raúl", "Carmen", "Miguel", "Rosa",
] as const;

export const PERUVIAN_SURNAMES = [
  "Quispe", "Flores", "García", "Torres", "Mamani", "Rojas", "Díaz", "Chávez", "Vega", "Castro",
  "Huamán", "Condori", "Salazar", "Paredes", "Silva", "Herrera", "Morales", "Ramírez", "Vásquez",
  "Gutiérrez", "Medina", "Cruz", "Pérez", "López", "Sánchez", "Rivera", "Ortiz", "Reyes", "Aguilar",
  "Mendoza", "Cáceres", "Espinoza", "Palomino", "Delgado", "Fernández", "Ríos", "Cordero", "Valdez",
  "Acosta", "Navarro",
] as const;

export type PeruvianPerson = { nombres: string; apellidos: string };

function pick<T>(items: readonly T[]): T {
  return items[randomInt(items.length)]!;
}

function pickDistinct<T>(items: readonly T[], exclude: T): T {
  const pool = items.filter((item) => item !== exclude);
  return pick(pool.length > 0 ? pool : items);
}

export function randomPeruvianPerson(): PeruvianPerson {
  const apellidoPaterno = pick(PERUVIAN_SURNAMES);
  const apellidoMaterno = pickDistinct(PERUVIAN_SURNAMES, apellidoPaterno);
  return {
    nombres: pick(PERUVIAN_FIRST_NAMES),
    apellidos: `${apellidoPaterno} ${apellidoMaterno}`,
  };
}

/** Estudiante estable por índice (1–660): mismo nombre, DNI y correo en cada seed. */
export function deterministicStudent(studentNum: number): PeruvianPerson & { dni: string } {
  const i = studentNum - 1;
  const nombres = PERUVIAN_FIRST_NAMES[i % PERUVIAN_FIRST_NAMES.length]!;
  const apellidoPaterno = PERUVIAN_SURNAMES[Math.floor(i / PERUVIAN_FIRST_NAMES.length) % PERUVIAN_SURNAMES.length]!;
  const apellidoMaterno =
    PERUVIAN_SURNAMES[(Math.floor(i / PERUVIAN_FIRST_NAMES.length) + 1) % PERUVIAN_SURNAMES.length]!;
  const dni = String(40_000_000 + studentNum).padStart(8, "0");
  return { nombres, apellidos: `${apellidoPaterno} ${apellidoMaterno}`, dni };
}

/** Docente estable por índice (0–22): mismo DNI y correo pro{DNI}@ en cada seed. */
export function deterministicTeacherDni(teacherIndex: number): string {
  return String(50_000_001 + teacherIndex).padStart(8, "0");
}

function slugPart(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

/** Genera DNI peruano único de 8 dígitos (rango demo 40M–79M). */
export function nextUniqueDni(used: Set<string>): string {
  for (let attempt = 0; attempt < 50_000; attempt++) {
    const dni = String(40_000_000 + randomInt(39_999_999)).padStart(8, "0");
    if (!used.has(dni)) {
      used.add(dni);
      return dni;
    }
  }
  throw new Error("No se pudo generar DNI único para seed demo");
}

export function teacherEmail(dni: string): string {
  return `pro${dni}@blenkir.edu.pe`;
}

/** Correo estudiante: nombre.apellido + últimos 4 del DNI @ dominio institucional. */
export function studentEmail(nombres: string, apellidos: string, dni: string, used: Set<string>): string {
  const base = `${slugPart(nombres)}.${slugPart(apellidos.split(" ")[0] ?? "alu")}${dni.slice(-4)}`;
  let email = `${base}@blenkir.edu.pe`;
  let suffix = 1;
  while (used.has(email)) {
    email = `${base}${suffix}@blenkir.edu.pe`;
    suffix++;
  }
  used.add(email);
  return email;
}
