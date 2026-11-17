import type { AttendanceStatus } from "../generated/prisma/client";

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "leave",
];

export const isAttendanceStatus = (value: unknown): value is AttendanceStatus =>
  typeof value === "string" &&
  ATTENDANCE_STATUSES.includes(value as AttendanceStatus);
