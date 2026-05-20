"use client";

import { BentoDashboard } from "@/components/dashboard/bento/BentoDashboard";
import type { Course, Enrollment, Student } from "@/types/academic";

type DashboardViewProps = {
  role?: string;
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  useApi?: boolean;
};

export function DashboardView({
  role = "admin",
  students,
  courses,
  enrollments,
  useApi = false,
}: DashboardViewProps) {
  return (
    <BentoDashboard
      role={role}
      students={students}
      courses={courses}
      enrollments={enrollments}
      useApi={useApi}
    />
  );
}
