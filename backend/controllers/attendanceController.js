import { prisma } from "../config/db.js";

const attendanceInclude = {
  student: { select: { id: true, name: true, rollNumber: true, batch: true } },
  class: { select: { id: true, name: true, subject: true, batch: true } },
  markedBy: { select: { id: true, name: true } },
};

const normalizeDate = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const markAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    if (!classId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "classId, date and records are required" });
    }
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Only the class teacher can mark attendance" });
    }
    const day = normalizeDate(date);
    const saved = [];
    for (const r of records) {
      if (!["present", "absent", "late", "leave"].includes(r.status)) {
        return res.status(400).json({ message: `Invalid status: ${r.status}` });
      }
      const doc = await prisma.attendance.upsert({
        where: {
          classId_studentId_date: {
            classId,
            studentId: r.studentId,
            date: day,
          },
        },
        create: {
          classId,
          studentId: r.studentId,
          date: day,
          status: r.status,
          remark: r.remark || "",
          markedById: req.user.id,
        },
        update: {
          status: r.status,
          remark: r.remark || "",
          markedById: req.user.id,
        },
        include: attendanceInclude,
      });
      saved.push(doc);
    }
    res.json({ message: `Marked ${saved.length} records`, saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { status, remark } = req.body;
    const record = await prisma.attendance.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    if (status && !["present", "absent", "late", "leave"].includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }
    const data = { markedById: req.user.id };
    if (status) data.status = status;
    if (remark !== undefined) data.remark = remark;
    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data,
      include: attendanceInclude,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed =
      req.user.role === "teacher" ||
      req.user.studentId === id ||
      req.user.student?.id === id;
    if (!allowed) {
      return res.status(403).json({ message: "Not allowed to view this student's attendance" });
    }
    const records = await prisma.attendance.findMany({
      where: { studentId: id },
      include: attendanceInclude,
      orderBy: { date: "desc" },
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const where = { classId };
    if (date) where.date = normalizeDate(date);
    const records = await prisma.attendance.findMany({
      where,
      include: attendanceInclude,
      orderBy: { date: "desc" },
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const record = await prisma.attendance.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    await prisma.attendance.delete({ where: { id: record.id } });
    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
