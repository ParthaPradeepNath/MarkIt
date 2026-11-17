import "./config/env.js";
import express from "express";
import cors from "cors";
import { connectDB, disconnectDB, getDatabaseInfo } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classes.js";
import studentRoutes from "./routes/students.js";
import attendanceRoutes from "./routes/attendance.js";
import reportRoutes from "./routes/reports.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    db: getDatabaseInfo(),
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
});
