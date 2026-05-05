import type { Course, Enrollment, Student, Teacher } from "@/types/academic";

export const seedTeachers: Teacher[] = [
  {
    id: "t1",
    codigo: "PR-001",
    nombres: "Ana",
    apellidos: "Quispe",
    especialidad: "Matemática",
    correo: "ana.quispe@colegio.edu.pe",
    telefono: "999111222",
  },
  {
    id: "t2",
    codigo: "PR-002",
    nombres: "Luis",
    apellidos: "Mendoza",
    especialidad: "Comunicación",
    correo: "luis.mendoza@colegio.edu.pe",
    telefono: "988777666",
  },
  {
    id: "t3",
    codigo: "PR-003",
    nombres: "María",
    apellidos: "Torres",
    especialidad: "Ciencias",
    correo: "maria.torres@colegio.edu.pe",
    telefono: "977555444",
  },
];

export const seedCourses: Course[] = [
  { id: "c1", codigo: "CU-101", nombre: "Álgebra", nivel: "4to Secundaria", profesorId: "t1" },
  { id: "c2", codigo: "CU-201", nombre: "Literatura", nivel: "5to Secundaria", profesorId: "t2" },
  { id: "c3", codigo: "CU-301", nombre: "Ciencias", nivel: "5to Secundaria", profesorId: "t3" },
];

export const seedStudents: Student[] = [
  {
    id: "s1",
    codigo: "ST-001",
    nombres: "Lucía",
    apellidos: "Paredes",
    nivel: "4to Secundaria",
    correo: "lucia.paredes@colegio.edu.pe",
    telefono: "987654321",
    estado: "activo",
    metrics: {
      promedioGeneral: 15.2,
      asistenciaGeneral: 92,
      lms: {
        engagement: "alto",
        actividadSemanalPct: [72, 68, 75, 80],
        minutosPorSemana: [120, 110, 130, 140],
        tareasEntregadas: 9,
        tareasTotales: 10,
        horasPlataformaSemana: 4.2,
      },
    },
  },
  {
    id: "s2",
    codigo: "ST-002",
    nombres: "Carlos",
    apellidos: "Rojas",
    nivel: "5to Secundaria",
    correo: "carlos.rojas@colegio.edu.pe",
    telefono: "912345678",
    estado: "en riesgo",
    metrics: {
      promedioGeneral: 10.8,
      asistenciaGeneral: 68,
      lms: {
        engagement: "bajo",
        actividadSemanalPct: [38, 32, 40, 35],
        minutosPorSemana: [45, 40, 50, 42],
        tareasEntregadas: 4,
        tareasTotales: 10,
        horasPlataformaSemana: 1.5,
      },
    },
  },
  {
    id: "s3",
    codigo: "ST-003",
    nombres: "Diego",
    apellidos: "Salas",
    nivel: "5to Secundaria",
    correo: "diego.salas@colegio.edu.pe",
    telefono: "945612378",
    estado: "activo",
    metrics: {
      promedioGeneral: 12.4,
      asistenciaGeneral: 78,
      lms: {
        engagement: "medio",
        actividadSemanalPct: [55, 58, 52, 60],
        minutosPorSemana: [70, 75, 68, 80],
        tareasEntregadas: 7,
        tareasTotales: 10,
        horasPlataformaSemana: 2.6,
      },
    },
  },
  {
    id: "s4",
    codigo: "ST-004",
    nombres: "Valeria",
    apellidos: "Núñez",
    nivel: "4to Secundaria",
    correo: "valeria.nunez@colegio.edu.pe",
    telefono: "956223344",
    estado: "activo",
    metrics: {
      promedioGeneral: 17.1,
      asistenciaGeneral: 88,
      lms: {
        engagement: "alto",
        actividadSemanalPct: [82, 79, 85, 88],
        minutosPorSemana: [150, 140, 160, 170],
        tareasEntregadas: 10,
        tareasTotales: 10,
        horasPlataformaSemana: 5.1,
      },
    },
  },
];

export const seedEnrollments: Enrollment[] = [
  { id: "e1", studentId: "s1", courseId: "c1", promedio: 15.5, asistenciaPct: 94 },
  { id: "e2", studentId: "s2", courseId: "c2", promedio: 9.2, asistenciaPct: 62 },
  { id: "e3", studentId: "s2", courseId: "c3", promedio: 10.1, asistenciaPct: 70 },
  { id: "e4", studentId: "s3", courseId: "c2", promedio: 12.0, asistenciaPct: 76 },
  { id: "e5", studentId: "s3", courseId: "c3", promedio: 12.8, asistenciaPct: 80 },
  { id: "e6", studentId: "s4", courseId: "c1", promedio: 17.4, asistenciaPct: 90 },
  { id: "e7", studentId: "s1", courseId: "c3", promedio: 14.8, asistenciaPct: 88 },
];

export const APP_SECTIONS = [
  "Dashboard",
  "Alertas",
  "Estudiantes",
  "Profesores",
  "Cursos",
  "Matrículas",
  "Datos académicos",
  "Actividad LMS",
  "Predicción",
  "Reportes",
] as const;

export type AppSection = (typeof APP_SECTIONS)[number];
