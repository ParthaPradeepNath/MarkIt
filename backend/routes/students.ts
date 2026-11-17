import express from "express";

import {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudents,
  updateStudent,
} from "../controllers/studentController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getStudents).post(authorize("teacher"), createStudent);
router.get("/:id", getStudentById);
router.put("/:id", authorize("teacher"), updateStudent);
router.delete("/:id", authorize("teacher"), deleteStudent);

export default router;
