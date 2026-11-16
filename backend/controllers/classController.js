import Class from "../models/Class.js";
import Student from "../models/Student.js";

export const getClasses = async (req, res) => {
  try {
    let classes;
    if (req.user.role === "teacher") {
      classes = await Class.find({ teacherId: req.user._id }).populate("enrolledStudents");
    } else {
      const studentId = req.user.studentId?._id || req.user.studentId;
      if (!studentId) return res.json([]);
      classes = await Class.find({ enrolledStudents: studentId }).populate("enrolledStudents");
    }
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).populate("enrolledStudents");
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createClass = async (req, res) => {
  try {
    const { name, subject, batch, schedule } = req.body;
    if (!name || !subject || !batch) {
      return res.status(400).json({ message: "Name, subject and batch are required" });
    }
    const cls = await Class.create({
      name,
      subject,
      batch,
      schedule,
      teacherId: req.user._id,
    });
    res.status(201).json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const enrollStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only manage your own classes" });
    }
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds array is required" });
    }
    for (const id of studentIds) {
      if (!cls.enrolledStudents.includes(id)) cls.enrolledStudents.push(id);
      await Student.findByIdAndUpdate(id, { className: cls._id });
    }
    await cls.save();
    const populated = await Class.findById(cls._id).populate("enrolledStudents");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeStudentFromClass = async (req, res) => {
  try {
    const { studentId } = req.params;
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    cls.enrolledStudents = cls.enrolledStudents.filter((id) => id.toString() !== studentId);
    await cls.save();
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own classes" });
    }
    await cls.deleteOne();
    res.json({ message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
