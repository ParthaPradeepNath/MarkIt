import { prisma } from "../config/db.js";
import { hashPassword } from "../lib/user.js";

const studentInclude = { class: true };

export const getStudents = async (req, res) => {
  try {
    const { classId, batch } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    if (batch) where.batch = batch;
    const students = await prisma.student.findMany({ where, include: studentInclude });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: studentInclude,
    });
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
    const normalizedEmail = email.trim().toLowerCase();
    if (await prisma.student.findUnique({ where: { email: normalizedEmail } })) {
      return res.status(400).json({ message: "Student with this email already exists" });
    }
    if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    const student = await prisma.student.create({
      data: {
        name,
        email: normalizedEmail,
        rollNumber,
        batch,
        classId: className || null,
        guardianPhone,
      },
      include: studentInclude,
    });
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: await hashPassword(password || "password123"),
        role: "student",
        studentId: student.id,
      },
    });
    res.status(201).json({ student, user: { id: user.id, email: user.email } });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Duplicate value (email already exists)" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { name, rollNumber, batch, className, guardianPhone } = req.body;
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const data = {};
    if (name) data.name = name;
    if (rollNumber) data.rollNumber = rollNumber;
    if (batch) data.batch = batch;
    if (guardianPhone !== undefined) data.guardianPhone = guardianPhone;
    if (className !== undefined) data.classId = className || null;

    const updated = await prisma.student.update({
      where: { id: student.id },
      data,
      include: studentInclude,
    });
    await prisma.user.updateMany({
      where: { studentId: student.id },
      data: { name: updated.name },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) return res.status(404).json({ message: "Student not found" });
    // Delete the linked login first, then the student. Removing the student
    // clears class membership and attendance through the schema's ON DELETE rules.
    await prisma.user.deleteMany({ where: { studentId: student.id } });
    await prisma.student.delete({ where: { id: student.id } });
    res.json({ message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
