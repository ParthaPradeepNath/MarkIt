import { prisma } from "../config/db.js";

const PRESENT_LIKE = ["present", "late"];

const computeSummary = (records) => {
  const total = records.length;
  const counts = {
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  };
  records.forEach((r) => {
    if (counts[r.status] !== undefined) counts[r.status] += 1;
  });
  const attended = records.filter((r) => PRESENT_LIKE.includes(r.status)).length;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
  return { total, ...counts, percentage, risk: total > 0 && percentage < 75 };
};

const buildTrend = (records) => {
  const byMonth = {};
  records.forEach((r) => {
    const key = new Date(r.date).toISOString().slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(r);
  });
  return Object.keys(byMonth)
    .sort()
    .map((month) => {
      const s = computeSummary(byMonth[month]);
      return { month, total: s.total, percentage: s.percentage, present: s.present };
    });
};

export const getReport = async (req, res) => {
  try {
    const { type, studentId, classId, batch } = req.query;

    if (type === "student") {
      if (!studentId) return res.status(400).json({ message: "studentId is required" });
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true },
      });
      if (!student) return res.status(404).json({ message: "Student not found" });
      const records = await prisma.attendance.findMany({
        where: { studentId },
        include: { class: { select: { id: true, name: true, subject: true, batch: true } } },
      });
      const byClass = {};
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
      if (!classId) return res.status(400).json({ message: "classId is required" });
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
      const perStudent = {};
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
        students: studentSummaries.sort((a, b) => a.summary.percentage - b.summary.percentage),
      });
    }

    if (type === "batch") {
      if (!batch) return res.status(400).json({ message: "batch is required" });
      const students = await prisma.student.findMany({ where: { batch } });
      const ids = students.map((s) => s.id);
      const records = await prisma.attendance.findMany({
        where: { studentId: { in: ids } },
        include: {
          student: { select: { id: true, name: true, rollNumber: true, batch: true } },
        },
      });
      const perStudent = {};
      records.forEach((r) => {
        const sid = r.student?.id;
        if (!sid) return;
        if (!perStudent[sid]) perStudent[sid] = { student: r.student, records: [] };
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
        students: studentSummaries.sort((a, b) => a.summary.percentage - b.summary.percentage),
      });
    }

    return res
      .status(400)
      .json({ message: "type must be one of: student, class, batch" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLowAttendanceStudents = async (req, res) => {
  try {
    const classId = req.query.classId;
    const students = await prisma.student.findMany({
      where: classId ? { classId } : {},
    });
    const result = [];
    for (const s of students) {
      const records = await prisma.attendance.findMany({ where: { studentId: s.id } });
      const summary = computeSummary(records);
      if (summary.risk) {
        result.push({ student: s, summary });
      }
    }
    res.json(result.sort((a, b) => a.summary.percentage - b.summary.percentage));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
