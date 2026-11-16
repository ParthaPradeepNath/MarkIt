import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    batch: { type: String, required: true, trim: true },
    className: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    guardianPhone: { type: String, trim: true },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
