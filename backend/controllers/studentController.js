import Student from "../models/Student.js";
import User from "../models/User.js";
import Class from "../models/Class.js";

export const getStudents = async (req, res) => {
  try {
    const { classId, batch } = req.query;
    const filter = {};
    if (classId) filter.className = classId;
    if (batch) filter.batch = batch;
    const students = await Student.find(filter).populate("className");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("className");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { name, email, rollNumber, batch, className, guardianPhone, password } = req.body;
    if (!name || !email || !rollNumber || !batch) {
      return res.status(400).json({ message: "Name, email, rollNumber and batch are required" });
    }
    if (await Student.findOne({ email })) {
      return res.status(400).json({ message: "Student with this email already exists" });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    const student = await Student.create({
      name,
      email,
      rollNumber,
      batch,
      className: className || undefined,
      guardianPhone,
    });
    const user = await User.create({
      name,
      email,
      password: password || "password123",
      role: "student",
      studentId: student._id,
    });
    if (className) {
      const cls = await Class.findById(className);
      if (cls && !cls.enrolledStudents.includes(student._id)) {
        cls.enrolledStudents.push(student._id);
        await cls.save();
      }
    }
    res.status(201).json({ student, user: { id: user._id, email: user.email } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate value (email or rollNumber already exists)" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { name, rollNumber, batch, className, guardianPhone } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (name) student.name = name;
    if (rollNumber) student.rollNumber = rollNumber;
    if (batch) student.batch = batch;
    if (className) student.className = className;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
    await student.save();
    await User.findOneAndUpdate({ studentId: student._id }, { name: student.name });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    await Student.deleteOne({ _id: student._id });
    await User.deleteOne({ studentId: student._id });
    await Class.updateMany({ enrolledStudents: student._id }, { $pull: { enrolledStudents: student._id } });
    res.json({ message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
