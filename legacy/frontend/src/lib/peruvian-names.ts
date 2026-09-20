/** Nombres y apellidos frecuentes en Perú (costa, sierra y mix urbano). */
export const PERUVIAN_FIRST_NAMES = [
  "Mateo",
  "Valentina",
  "Santiago",
  "Luciana",
  "Sebastián",
  "Camila",
  "Diego",
  "Isabella",
  "Alejandro",
  "Sofía",
  "Daniel",
  "Mariana",
  "Andrés",
  "Emilia",
  "Gabriel",
  "Victoria",
  "Renato",
  "Fiorella",
  "Bruno",
  "Ariana",
  "Joaquín",
  "Mía",
  "Thiago",
  "Antonella",
  "Ian",
  "Lucía",
  "Adrián",
  "Valeria",
  "Emilio",
  "Nicole",
  "Rodrigo",
  "Paola",
  "César",
  "Milagros",
  "Eduardo",
  "Roxana",
  "Julio",
  "Katherine",
  "Marco",
  "Angela",
  "Felipe",
  "Ruth",
  "Héctor",
  "Gladys",
  "Óscar",
  "Patricia",
  "Raúl",
  "Carmen",
  "Miguel",
  "Rosa",
] as const;

export const PERUVIAN_SURNAMES = [
  "Quispe",
  "Flores",
  "García",
  "Torres",
  "Mamani",
  "Rojas",
  "Díaz",
  "Chávez",
  "Vega",
  "Castro",
  "Huamán",
  "Condori",
  "Salazar",
  "Paredes",
  "Silva",
  "Herrera",
  "Morales",
  "Ramírez",
  "Vásquez",
  "Gutiérrez",
  "Medina",
  "Cruz",
  "Pérez",
  "López",
  "Sánchez",
  "Rivera",
  "Ortiz",
  "Reyes",
  "Aguilar",
  "Mendoza",
  "Cáceres",
  "Espinoza",
  "Palomino",
  "Delgado",
  "Fernández",
  "Ríos",
  "Cordero",
  "Valdez",
  "Acosta",
  "Navarro",
] as const;

function secureIndex(max: number): number {
  if (max <= 0) return 0;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % max;
}

function pick<T>(items: readonly T[]): T {
  return items[secureIndex(items.length)]!;
}

function pickDistinct<T>(items: readonly T[], exclude: T): T {
  const pool = items.filter((item) => item !== exclude);
  return pick(pool.length > 0 ? pool : items);
}

/** Par nombre + dos apellidos al estilo registro escolar peruano. */
export function randomPeruvianPerson(): { nombres: string; apellidos: string } {
  const apellidoPaterno = pick(PERUVIAN_SURNAMES);
  const apellidoMaterno = pickDistinct(PERUVIAN_SURNAMES, apellidoPaterno);
  return {
    nombres: pick(PERUVIAN_FIRST_NAMES),
    apellidos: `${apellidoPaterno} ${apellidoMaterno}`,
  };
}
