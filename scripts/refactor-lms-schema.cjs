const fs = require('node:fs');
const path = 'backend/prisma/schema.prisma';
let s = fs.readFileSync(path,'utf8');
s = s.replace('model Student {', 'model Student {\n  resourceEvents LmsEvent[]\n  activityProgress ActivityProgress[]');
s = s.replace('model Teacher {', 'model Teacher {\n  resources CourseResource[]\n  activities AcademicActivity[]');
s = s.replace('model Course {', 'model Course {\n  resources CourseResource[]\n  activities AcademicActivity[]\n  events LmsEvent[]');
s += `
enum ResourceType {
  pdf
  documento
  presentacion
  enlace
  guia
  repaso
}
enum ActivityType {
  practica
  lectura
  repaso
  material_obligatorio
  otra
}
enum ActivityStatus {
  pendiente
  iniciada
  completada
}
enum LmsEventType {
  login
  logout
  sesion
  recurso
  actividad
  curso
}
model CourseResource {
  id BigInt @id @default(autoincrement())
  titulo String @db.VarChar(150)
  descripcion String? @db.Text
  tipo ResourceType
  url String @db.VarChar(1000)
  profesorId BigInt @map("profesor_id")
  courseId BigInt @map("curso_id")
  activo Boolean @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  profesor Teacher @relation(fields: [profesorId], references: [id], onDelete: Restrict)
  course Course @relation(fields: [courseId], references: [id], onDelete: Restrict)
  events LmsEvent[]
  @@index([courseId, activo])
  @@map("material_educativo")
}
model AcademicActivity {
  id BigInt @id @default(autoincrement())
  titulo String @db.VarChar(150)
  descripcion String? @db.Text
  tipo ActivityType
  profesorId BigInt @map("profesor_id")
  courseId BigInt @map("curso_id")
  activo Boolean @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  profesor Teacher @relation(fields: [profesorId], references: [id], onDelete: Restrict)
  course Course @relation(fields: [courseId], references: [id], onDelete: Restrict)
  progress ActivityProgress[]
  events LmsEvent[]
  @@index([courseId, activo])
  @@map("actividad_academica")
}
model ActivityProgress {
  studentId BigInt @map("estudiante_id")
  activityId BigInt @map("actividad_id")
  estado ActivityStatus @default(pendiente)
  startedAt DateTime? @map("iniciada_at")
  completedAt DateTime? @map("completada_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  student Student @relation(fields: [studentId], references: [id], onDelete: Restrict)
  activity AcademicActivity @relation(fields: [activityId], references: [id], onDelete: Restrict)
  @@id([studentId, activityId])
  @@map("actividad_progreso")
}
model LmsEvent {
  id BigInt @id @default(autoincrement())
  studentId BigInt @map("estudiante_id")
  tipo LmsEventType
  courseId BigInt? @map("curso_id")
  resourceId BigInt? @map("material_id")
  activityId BigInt? @map("actividad_id")
  durationSeconds Int @default(0) @map("duracion_segundos")
  createdAt DateTime @default(now()) @map("created_at")
  student Student @relation(fields: [studentId], references: [id], onDelete: Restrict)
  course Course? @relation(fields: [courseId], references: [id], onDelete: Restrict)
  resource CourseResource? @relation(fields: [resourceId], references: [id], onDelete: Restrict)
  activity AcademicActivity? @relation(fields: [activityId], references: [id], onDelete: Restrict)
  @@index([studentId, createdAt])
  @@index([courseId, createdAt])
  @@map("lms_evento")
}
`;
fs.writeFileSync(path,s);
