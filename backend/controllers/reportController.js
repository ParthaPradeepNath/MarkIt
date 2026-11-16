import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";

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
      const student = await Student.findById(studentId).populate("className");
      if (!student) return res.status(404).json({ message: "Student not found" });
      const records = await Attendance.find({ studentId }).populate("classId", "name subject batch");
      const byClass = {};
      records.forEach((r) => {
        const key = r.classId?._id?.toString() || "unknown";
        if (!byClass[key]) {
          byClass[key] = {
            className: r.classId?.name || "Unknown",
            subject: r.classId?.subject || "",
            batch: r.classId?.batch || "",
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
      const cls = await Class.findById(classId).populate("enrolledStudents");
      if (!cls) return res.status(404).json({ message: "Class not found" });
      const records = await Attendance.find({ classId }).populate("studentId", "name rollNumber");
      const perStudent = {};
      records.forEach((r) => {
        const sid = r.studentId?._id?.toString() || "unknown";
        if (!perStudent[sid]) {
          perStudent[sid] = {
            student: r.studentId || { name: "Unknown", rollNumber: "-" },
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
      const students = await Student.find({ batch });
      const ids = students.map((s) => s._id);
      const records = await Attendance.find({ studentId: { $in: ids } }).populate(
        "studentId",
        "name rollNumber batch"
      );
      const perStudent = {};
      records.forEach((r) => {
        const sid = r.studentId?._id?.toString();
        if (!sid) return;
        if (!perStudent[sid]) perStudent[sid] = { student: r.studentId, records: [] };
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
    const threshold = parseInt(req.query.threshold) || 75;
    const classId = req.query.classId;
    const studentFilter = {};
    if (classId) studentFilter.className = classId;
    const students = await Student.find(studentFilter);
    const result = [];
    for (const s of students) {
      const records = await Attendance.find({ studentId: s._id });
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
