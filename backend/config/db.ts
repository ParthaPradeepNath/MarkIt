import "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Prisma 7 connects through a driver adapter instead of an implicit engine.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

// Reuse a single client across hot reloads in development.
const prisma = globalThis.__markitPrisma ?? new PrismaClient({ adapter });
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
