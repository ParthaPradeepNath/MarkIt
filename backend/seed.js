import "./config/env.js";
import connectDB, { disconnectDB } from "./config/db.js";
import User from "./models/User.js";
import Student from "./models/Student.js";
import Class from "./models/Class.js";
import Attendance from "./models/Attendance.js";

const run = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Class.deleteMany({}),
    Attendance.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  const teacher = await User.create({
    name: "Dr. Partha Nath",
    email: "teacher@school.com",
    password: "password123",
    role: "teacher",
  });

  const studentSeed = [
    { name: "Arjun Sharma", rollNumber: "B01", batch: "Batch A", guardianPhone: "+91 98111 00001" },
    { name: "Priya Patel", rollNumber: "B02", batch: "Batch A", guardianPhone: "+91 98111 00002" },
    { name: "Rahul Verma", rollNumber: "B03", batch: "Batch A", guardianPhone: "+91 98111 00003" },
    { name: "Sneha Iyer", rollNumber: "B04", batch: "Batch A", guardianPhone: "+91 98111 00004" },
    { name: "Kabir Singh", rollNumber: "B05", batch: "Batch A", guardianPhone: "+91 98111 00005" },
    { name: "Meera Nair", rollNumber: "C01", batch: "Batch B", guardianPhone: "+91 98111 00006" },
    { name: "Vikram Rao", rollNumber: "C02", batch: "Batch B", guardianPhone: "+91 98111 00007" },
  ];

  const createdStudents = [];
  for (const s of studentSeed) {
    const student = await Student.create({
      name: s.name,
      email: `${s.name.toLowerCase().split(" ").join(".")}@student.school.com`,
      rollNumber: s.rollNumber,
      batch: s.batch,
      guardianPhone: s.guardianPhone,
    });
    await User.create({
      name: s.name,
      email: `${s.name.toLowerCase().split(" ").join(".")}@student.school.com`,
      password: "password123",
      role: "student",
      studentId: student._id,
    });
    createdStudents.push(student);
  }

  const classA = await Class.create({
    name: "Mathematics 101",
    subject: "Mathematics",
    batch: "Batch A",
    teacherId: teacher._id,
    schedule: "Mon/Wed/Fri 10 AM",
    enrolledStudents: createdStudents.slice(0, 5).map((s) => s._id),
  });
  const classB = await Class.create({
    name: "Physics 201",
    subject: "Physics",
    batch: "Batch B",
    teacherId: teacher._id,
    schedule: "Tue/Thu 2 PM",
    enrolledStudents: createdStudents.slice(5).map((s) => s._id),
  });

  await Student.updateMany(
    { _id: { $in: classA.enrolledStudents } },
    { className: classA._id }
  );
  await Student.updateMany(
    { _id: { $in: classB.enrolledStudents } },
    { className: classB._id }
  );

  const statuses = ["present", "present", "present", "absent", "late", "leave", "present", "absent"];
  const days = 30;
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });

  const allStudents = [...createdStudents.slice(0, 5).map((s) => ({ s, cls: classA })), ...createdStudents.slice(5).map((s) => ({ s, cls: classB }))];

  for (const { s, cls } of allStudents) {
    const isRiskStudent = s.name === "Kabir Singh" || s.name === "Vikram Rao";
    for (const date of dates) {
      if (date.getUTCDay() === 0) continue;
      let status = statuses[Math.floor(Math.random() * statuses.length)];
      if (isRiskStudent && Math.random() < 0.55) status = "absent";
      await Attendance.create({
        classId: cls._id,
        studentId: s._id,
        date,
        status,
        markedBy: teacher._id,
        remark: status === "absent" ? "absent" : "",
      });
    }
  }

  console.log(`
Seed complete!
  Teacher : teacher@school.com / password123
  Student : arjun.sharma@student.school.com / password123
  (All students share password: password123)

  Classes : ${classA.name} (Batch A), ${classB.name} (Batch B)
  Attendance : generated for last ${days} days
  `);

  await disconnectDB();
};

run().catch(async (err) => {
  console.error(err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
