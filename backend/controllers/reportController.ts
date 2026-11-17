import type { Request, Response } from "express";

import { prisma } from "../config/db.js";
import type { AttendanceStatus } from "../generated/prisma/client";
import { errorMessage } from "../lib/error.js";
import { queryString } from "../lib/http.js";

const PRESENT_LIKE: readonly AttendanceStatus[] = ["present", "late"];

type ReportRecord = { status: AttendanceStatus; date: Date | string };

type StudentRef = {
  name: string;
  rollNumber: string;
  id?: string;
  batch?: string;
};

type GroupedRecords<T extends StudentRef = StudentRef> = {
  student: T;
  records: ReportRecord[];
};

const computeSummary = (records: readonly ReportRecord[]) => {
  const total = records.length;
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  };
  records.forEach((r) => {
    counts[r.status] += 1;
  });
  const attended = records.filter((r) =>
    PRESENT_LIKE.includes(r.status)
  ).length;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
  return { total, ...counts, percentage, risk: total > 0 && percentage < 75 };
};

const buildTrend = (records: readonly ReportRecord[]) => {
  const byMonth: Record<string, ReportRecord[]> = {};
  records.forEach((r) => {
    const key = new Date(r.date).toISOString().slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(r);
  });
  return Object.keys(byMonth)
    .sort()
    .map((month) => {
      const s = computeSummary(byMonth[month]);
      return {
        month,
        total: s.total,
        percentage: s.percentage,
        present: s.present,
      };
    });
};

export const getReport = async (req: Request, res: Response) => {
  try {
    const type = queryString(req.query.type);
    const studentId = queryString(req.query.studentId);
    const classId = queryString(req.query.classId);
    const batch = queryString(req.query.batch);

    if (type === "student") {
      if (!studentId)
        return res.status(400).json({ message: "studentId is required" });
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true },
      });
      if (!student)
        return res.status(404).json({ message: "Student not found" });
      const records = await prisma.attendance.findMany({
        where: { studentId },
        include: {
          class: {
            select: { id: true, name: true, subject: true, batch: true },
          },
        },
      });
      const byClass: Record<
        string,
        {
          className: string;
          subject: string;
          batch: string;
          records: ReportRecord[];
        }
      > = {};
      records.forEach((r) => {
        const key = r.class?.id || "unknown";
        if (!byClass[key]) {
          byClass[key] = {
            className: r.class?.name || "Unknown",
            subject: r.class?.subject || "",
            batch: r.class?.batch || "",
            records: [],
          };
        }
        byClass[key].records.push(r);
      });
      const classSummaries = Object.values(byClass).map((c) => ({
        ...c,
        summary: computeSummary(c.records),
      }));
      return res.json({
        student,
        summary: computeSummary(records),
        trend: buildTrend(records),
        byClass: classSummaries,
      });
    }

    if (type === "class") {
      if (!classId)
        return res.status(400).json({ message: "classId is required" });
      const cls = await prisma.class.findUnique({
        where: { id: classId },
        include: { students: true },
      });
      if (!cls) return res.status(404).json({ message: "Class not found" });
      const records = await prisma.attendance.findMany({
        where: { classId },
        include: {
          student: { select: { id: true, name: true, rollNumber: true } },
        },
      });
      const perStudent: Record<string, GroupedRecords> = {};
      records.forEach((r) => {
        const sid = r.student?.id || "unknown";
        if (!perStudent[sid]) {
          perStudent[sid] = {
            student: r.student || { name: "Unknown", rollNumber: "-" },
            records: [],
          };
        }
        perStudent[sid].records.push(r);
      });
      const studentSummaries = Object.values(perStudent).map((p) => ({
        student: p.student,
        summary: computeSummary(p.records),
      }));
      return res.json({
        class: cls,
        summary: computeSummary(records),
        trend: buildTrend(records),
        students: studentSummaries.sort(
          (a, b) => a.summary.percentage - b.summary.percentage
        ),
      });
    }

    if (type === "batch") {
      if (!batch) return res.status(400).json({ message: "batch is required" });
      const students = await prisma.student.findMany({ where: { batch } });
      const ids = students.map((s) => s.id);
      const records = await prisma.attendance.findMany({
        where: { studentId: { in: ids } },
        include: {
          student: {
            select: { id: true, name: true, rollNumber: true, batch: true },
          },
        },
      });
      const perStudent: Record<string, GroupedRecords> = {};
      records.forEach((r) => {
        const sid = r.student?.id;
        if (!sid) return;
        if (!perStudent[sid])
          perStudent[sid] = { student: r.student, records: [] };
        perStudent[sid].records.push(r);
      });
      const studentSummaries = Object.values(perStudent).map((p) => ({
        student: p.student,
        summary: computeSummary(p.records),
      }));
      return res.json({
        batch,
        totalStudents: students.length,
        summary: computeSummary(records),
        trend: buildTrend(records),
        students: studentSummaries.sort(
          (a, b) => a.summary.percentage - b.summary.percentage
        ),
      });
    }

    return res
      .status(400)
      .json({ message: "type must be one of: student, class, batch" });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

export const getLowAttendanceStudents = async (req: Request, res: Response) => {
  try {
    const classId = queryString(req.query.classId);
    const students = await prisma.student.findMany({
      where: classId ? { classId } : {},
    });
    const result = [];
    for (const s of students) {
      const records = await prisma.attendance.findMany({
        where: { studentId: s.id },
      });
      const summary = computeSummary(records);
      if (summary.risk) {
        result.push({ student: s, summary });
      }
    }
    res.json(
      result.sort((a, b) => a.summary.percentage - b.summary.percentage)
    );
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};
