import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent", "late", "leave"], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    remark: { type: String, trim: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ classId: 1, studentId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
