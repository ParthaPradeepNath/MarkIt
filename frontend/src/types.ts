import type { LucideIcon } from "lucide-react";

export type Role = "teacher" | "student";
export type AttendanceStatus = "present" | "absent" | "late" | "leave";
export type StatusFilterValue = AttendanceStatus | "all";

export type ClassInfo = {
  id: string;
  name: string;
  subject: string;
  batch: string;
  teacherId?: string;
  schedule?: string | null;
  students?: Student[];
  createdAt?: string;
  updatedAt?: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  batch: string;
  classId?: string | null;
  class?: ClassInfo | null;
  guardianPhone?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string | null;
  student?: (Student & { class?: ClassInfo | null }) | null;
};

export type AttendanceRecord = {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  remark?: string | null;
  markedById?: string;
  student?: Pick<Student, "id" | "name" | "rollNumber" | "batch">;
  class?: Pick<ClassInfo, "id" | "name" | "subject" | "batch">;
  markedBy?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
};

export type StatusCounts = Record<StatusFilterValue, number>;

export type ReportSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
  risk: boolean;
};

export type ReportTrendPoint = {
  month: string;
  total: number;
  percentage: number;
  present: number;
};

export type StudentSummary = {
  student: Student;
  summary: ReportSummary;
};

export type ClassSummary = {
  className: string;
  subject: string;
  batch: string;
  summary: ReportSummary;
};

export type ReportData = {
  student?: Student & { class?: ClassInfo | null };
  class?: ClassInfo;
  batch?: string;
  totalStudents?: number;
  summary: ReportSummary;
  trend: ReportTrendPoint[];
  students?: StudentSummary[];
  byClass?: ClassSummary[];
};

export type NavItemData = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItemData[];
};
