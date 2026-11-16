import express from "express";
import { getReport, getLowAttendanceStudents } from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/attendance", getReport);
router.get("/low-attendance", getLowAttendanceStudents);

export default router;
