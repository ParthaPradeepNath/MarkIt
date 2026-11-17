import type { Class, PrismaClient, Role, Student } from "@prisma/client";

/** The user shape attached to every request by the `protect` middleware. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId: string | null;
  student: (Student & { class: Class | null }) | null;
};

declare global {
  // Reused Prisma client across Bun --watch reloads in development.
  // eslint-disable-next-line no-var
  var __markitPrisma: PrismaClient | undefined;

  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}

export {};
