import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import { backendDir } from "./env.js";

const LOCAL_DB_DIR = path.join(backendDir, ".data", "mongo");
const LOCAL_DB_NAME = process.env.LOCAL_DB_NAME || "markit";
const LOCAL_DB_PORT = Number(process.env.LOCAL_DB_PORT || 27017);
const LOCAL_DB_URI =
  process.env.LOCAL_DB_URI ||
  `mongodb://127.0.0.1:${LOCAL_DB_PORT}/${LOCAL_DB_NAME}`;

let localMongo = null;

const redactUri = (uri) =>
  uri?.replace(/(mongodb(?:\+srv)?:\/\/[^:/@]+:)[^@]*@/, "$1***@") || "";

const isProduction = () => process.env.NODE_ENV === "production";

const startLocalMongo = async (reason) => {
  // Reuse a local MongoDB that is already running (for example the one started
  // by a previous dev server or by `npm run seed`).
  try {
    await mongoose.connect(LOCAL_DB_URI, { serverSelectionTimeoutMS: 1500 });
    process.env.MARKIT_LOCAL_DB = "1";
    console.warn(
      `MongoDB connection failed (${reason}); using the local database already running at ${LOCAL_DB_URI}`
    );
    return mongoose.connection;
  } catch {
    // Nothing is listening yet, start one below.
  }

  const { MongoMemoryServer } = await import("mongodb-memory-server");

  await fs.mkdir(LOCAL_DB_DIR, { recursive: true });

  localMongo = await MongoMemoryServer.create({
    instance: {
      port: LOCAL_DB_PORT,
      dbPath: LOCAL_DB_DIR,
      dbName: LOCAL_DB_NAME,
      storageEngine: "wiredTiger",
    },
  });

  const uri = localMongo.getUri(LOCAL_DB_NAME);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  process.env.MARKIT_LOCAL_DB = "1";

  console.warn(
    [
      "",
      "MongoDB connection failed, using a local persistent database instead.",
      `  Reason        : ${reason}`,
      `  Data folder   : ${LOCAL_DB_DIR}`,
      `  Connection    : ${uri}`,
      "  Health check  : GET /api/health shows the active database.",
      "  Set DISABLE_LOCAL_DB=1 to disable this fallback and fail fast.",
      "",
    ].join("\n")
  );

  return mongoose.connection;
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();

  if (uri) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(
        `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
      );
      return conn.connection;
    } catch (error) {
      const message = error.message.split("\n")[0];
      const canFallback =
        !isProduction() && process.env.DISABLE_LOCAL_DB !== "1";

      if (!canFallback) {
        console.error(`MongoDB connection error: ${message}`);
        console.error(`URI: ${redactUri(uri)}`);
        process.exit(1);
      }

      console.warn(`MongoDB connection error: ${message}`);
      console.warn(`Configured URI: ${redactUri(uri)}`);

      try {
        return await startLocalMongo(message);
      } catch (localError) {
        console.error(`Local MongoDB failed to start: ${localError.message}`);
        process.exit(1);
      }
    }
  }

  if (isProduction() || process.env.DISABLE_LOCAL_DB === "1") {
    console.error("MONGO_URI is not set.");
    process.exit(1);
  }

  console.warn("MONGO_URI is not set, starting a local persistent database.");

  try {
    return await startLocalMongo("MONGO_URI is not set");
  } catch (localError) {
    console.error(`Local MongoDB failed to start: ${localError.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (localMongo) {
    await localMongo.stop({ doCleanup: false });
    localMongo = null;
    delete process.env.MARKIT_LOCAL_DB;
  }
};

export const getDatabaseInfo = () => ({
  state: mongoose.connection.readyState,
  name: mongoose.connection.name || null,
  host: mongoose.connection.host || null,
  local: process.env.MARKIT_LOCAL_DB === "1",
});

export default connectDB;
