import express from "express";
import {
  markAttendance,
  updateAttendance,
  getStudentAttendance,
  getClassAttendance,
  deleteAttendance,
} from "../controllers/attendanceController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", authorize("teacher"), markAttendance);
router.get("/student/:id", getStudentAttendance);
router.get("/class/:classId", getClassAttendance);
router.put("/:id", authorize("teacher"), updateAttendance);
router.delete("/:id", authorize("teacher"), deleteAttendance);

export default router;
