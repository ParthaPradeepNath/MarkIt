import express from "express";
import {
  getClasses,
  getClassById,
  createClass,
  enrollStudents,
  removeStudentFromClass,
  deleteClass,
} from "../controllers/classController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getClasses).post(authorize("teacher"), createClass);
router.get("/:id", getClassById);
router.post("/:id/enroll", authorize("teacher"), enrollStudents);
router.delete("/:id/students/:studentId", authorize("teacher"), removeStudentFromClass);
router.delete("/:id", authorize("teacher"), deleteClass);

export default router;
