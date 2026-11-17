import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../config/db.js";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        student: { include: { class: true } },
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not allowed` });
    }
    next();
  };
};
