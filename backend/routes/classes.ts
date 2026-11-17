import express from "express";

import {
  createClass,
  deleteClass,
  enrollStudents,
  getClassById,
  getClasses,
  removeStudentFromClass,
} from "../controllers/classController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getClasses).post(authorize("teacher"), createClass);
router.get("/:id", getClassById);
router.post("/:id/enroll", authorize("teacher"), enrollStudents);
router.delete(
  "/:id/students/:studentId",
  authorize("teacher"),
  removeStudentFromClass
);
router.delete("/:id", authorize("teacher"), deleteClass);

export default router;
