import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import type { Class, Student, User } from "../generated/prisma/client";
import { prisma } from "../config/db.js";
import { hashPassword, matchPassword } from "../lib/user.js";
import { errorMessage } from "../lib/error.js";

const userInclude = { student: { include: { class: true } } } as const;

type PopulatedUser = User & { student: (Student & { class: Class | null }) | null };

const toUserResponse = (user: PopulatedUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  student: user.student ?? null,
});

const generateToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: userInclude,
    });
    if (!user || !(await matchPassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: generateToken(user.id), user: toUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

export const getMe = (req: Request, res: Response) => {
  res.json(req.user);
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, guardianPhone } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: userInclude,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (name) {
      await prisma.user.update({ where: { id: user.id }, data: { name } });
    }
    if (user.studentId && guardianPhone) {
      await prisma.student.update({
        where: { id: user.studentId },
        data: { guardianPhone },
      });
    }
    const updated = await prisma.user.findUnique({
      where: { id: user.id },
      include: userInclude,
    });
    res.json(toUserResponse(updated as PopulatedUser));
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !(await matchPassword(currentPassword, user.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};
