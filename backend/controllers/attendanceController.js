import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";

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
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the class teacher can mark attendance" });
    }
    const day = normalizeDate(date);
    const saved = [];
    for (const r of records) {
      if (!["present", "absent", "late", "leave"].includes(r.status)) {
        return res.status(400).json({ message: `Invalid status: ${r.status}` });
      }
      const doc = await Attendance.findOneAndUpdate(
        { classId, studentId: r.studentId, date: day },
        { status: r.status, remark: r.remark || "", markedBy: req.user._id },
        { upsert: true, new: true }
      );
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
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    if (status && !["present", "absent", "late", "leave"].includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }
    if (status) record.status = status;
    if (remark !== undefined) record.remark = remark;
    record.markedBy = req.user._id;
    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed =
      req.user.role === "teacher" ||
      (req.user.studentId && (req.user.studentId._id?.toString() === id || req.user.studentId.toString() === id));
    if (!allowed) {
      return res.status(403).json({ message: "Not allowed to view this student's attendance" });
    }
    const records = await Attendance.find({ studentId: id })
      .populate("classId", "name subject batch")
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const filter = { classId };
    if (date) filter.date = normalizeDate(date);
    const records = await Attendance.find(filter)
      .populate("studentId", "name rollNumber batch")
      .populate("classId", "name subject batch")
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    await record.deleteOne();
    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
