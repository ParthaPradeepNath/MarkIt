import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    batch: { type: String, required: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    schedule: { type: String, trim: true },
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  },
  { timestamps: true }
);

const Class = mongoose.model("Class", classSchema);
export default Class;
