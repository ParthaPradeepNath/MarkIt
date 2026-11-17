import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { errorMessage } from "../lib/error.js";

const classInclude = { students: true } as const;

export const getClasses = async (req: Request, res: Response) => {
  try {
    let classes;
    if (req.user.role === "teacher") {
      classes = await prisma.class.findMany({
        where: { teacherId: req.user.id },
        include: classInclude,
      });
    } else {
      if (!req.user.studentId) return res.json([]);
      classes = await prisma.class.findMany({
        where: { students: { some: { id: req.user.studentId } } },
        include: classInclude,
      });
    }
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

export const getClassById = async (req: Request, res: Response) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: classInclude,
    });
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, subject, batch, schedule } = req.body;
    if (!name || !subject || !batch) {
      return res.status(400).json({ message: "Name, subject and batch are required" });
    }
    const cls = await prisma.class.create({
      data: { name, subject, batch, schedule, teacherId: req.user.id },
      include: classInclude,
    });
    res.status(201).json(cls);
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

export const enrollStudents = async (req: Request, res: Response) => {
  try {
    const { studentIds } = req.body;
    const cls = await prisma.class.findUnique({ where: { id: req.params.id } });
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.teacherId !== req.user.id) {
      return res.status(403).json({ message: "You can only manage your own classes" });
    }
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds array is required" });
    }
    for (const id of studentIds as string[]) {
      await prisma.student.updateMany({
        where: { id },
        data: { classId: cls.id },
      });
    }
    const populated = await prisma.class.findUnique({
      where: { id: cls.id },
      include: classInclude,
    });
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

export const removeStudentFromClass = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const cls = await prisma.class.findUnique({ where: { id: req.params.id } });
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.teacherId !== req.user.id) {
      return res.status(403).json({ message: "You can only manage your own classes" });
    }
    await prisma.student.updateMany({
      where: { id: studentId, classId: cls.id },
      data: { classId: null },
    });
    const populated = await prisma.class.findUnique({
      where: { id: cls.id },
      include: classInclude,
    });
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  try {
    const cls = await prisma.class.findUnique({ where: { id: req.params.id } });
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.teacherId !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own classes" });
    }
    // ON DELETE rules clear Student.classId and remove attendance for this class.
    await prisma.class.delete({ where: { id: cls.id } });
    res.json({ message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};
