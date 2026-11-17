import { PrismaClient } from "@prisma/client";

// Reuse a single client across hot reloads in development.
const prisma = globalThis.__markitPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__markitPrisma = prisma;
}

let connected = false;

export const connectDB = async (): Promise<PrismaClient> => {
  await prisma.$connect();
  connected = true;
  console.log("PostgreSQL connected (Prisma)");
  return prisma;
};

export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  connected = false;
};

export const getDatabaseInfo = () => ({
  state: connected ? "connected" : "disconnected",
  provider: "postgresql",
  orm: "prisma",
});

export { prisma };
export default prisma;
