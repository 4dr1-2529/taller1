"use client";
import { Building2, GraduationCap, Shield, Users } from "lucide-react";
type Props = { institutionName: string; directorName: string; directorEmail?: string; totalStudents: number; totalTeachers: number; };
export function InstitutionOverview({ institutionName, directorName, directorEmail, totalStudents, totalTeachers }: Props) {
  return <section className="institution-intro">
    <div className="institution-intro__heading">
      <p className="intelligence-eyebrow"><Building2 size={15} aria-hidden /> {institutionName}</p>
      <h2>Centro de comando institucional</h2>
      <p>Una visión conectada del riesgo, el aprendizaje y el acompañamiento académico.</p>
    </div>
    <div className="institution-context">
      <span><Users size={16} aria-hidden /><strong>{totalStudents}</strong> estudiantes</span>
      <span><GraduationCap size={16} aria-hidden /><strong>{totalTeachers}</strong> profesores</span>
      <span className="institution-context__director"><Shield size={16} aria-hidden /><span><strong>{directorName}</strong>{directorEmail ? <small>{directorEmail}</small> : null}</span></span>
    </div>
  </section>;
}
