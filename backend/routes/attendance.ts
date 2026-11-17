import express from "express";

import {
  deleteAttendance,
  getClassAttendance,
  getStudentAttendance,
  markAttendance,
  updateAttendance,
} from "../controllers/attendanceController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", authorize("teacher"), markAttendance);
router.get("/student/:id", getStudentAttendance);
router.get("/class/:classId", getClassAttendance);
router.put("/:id", authorize("teacher"), updateAttendance);
router.delete("/:id", authorize("teacher"), deleteAttendance);

export default router;
