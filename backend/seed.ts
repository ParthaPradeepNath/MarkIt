import "./config/env.js";
import type { AttendanceStatus } from "./generated/prisma/client";
import { Prisma } from "./generated/prisma/client";
import { connectDB, disconnectDB, prisma } from "./config/db.js";
import { hashPassword } from "./lib/user.js";

const run = async () => {
  await connectDB();

  // Delete in FK-safe order.
  await prisma.attendance.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.class.deleteMany({});
  console.log("Cleared existing data");

  const teacher = await prisma.user.create({
    data: {
      name: "Dr. Partha Nath",
      email: "teacher@school.com",
      password: await hashPassword("password123"),
      role: "teacher",
    },
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
    const email = `${s.name.toLowerCase().split(" ").join(".")}@student.school.com`;
    const student = await prisma.student.create({
      data: {
        name: s.name,
        email,
        rollNumber: s.rollNumber,
        batch: s.batch,
        guardianPhone: s.guardianPhone,
      },
    });
    const hashedPassword = await hashPassword("password123");
    await prisma.user.create({
      data: {
        name: s.name,
        email,
        password: hashedPassword,
        role: "student",
        studentId: student.id,
      },
    });
    createdStudents.push(student);
  }

  const classA = await prisma.class.create({
    data: {
      name: "Mathematics 101",
      subject: "Mathematics",
      batch: "Batch A",
      teacherId: teacher.id,
      schedule: "Mon/Wed/Fri 10 AM",
    },
  });
  const classB = await prisma.class.create({
    data: {
      name: "Physics 201",
      subject: "Physics",
      batch: "Batch B",
      teacherId: teacher.id,
      schedule: "Tue/Thu 2 PM",
    },
  });

  const classAStudents = createdStudents.slice(0, 5);
  const classBStudents = createdStudents.slice(5);
  await prisma.student.updateMany({
    where: { id: { in: classAStudents.map((s) => s.id) } },
    data: { classId: classA.id },
  });
  await prisma.student.updateMany({
    where: { id: { in: classBStudents.map((s) => s.id) } },
    data: { classId: classB.id },
  });

  const statuses: AttendanceStatus[] = ["present", "present", "present", "absent", "late", "leave", "present", "absent"];
  const days = 30;
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });

  const attendanceData: Prisma.AttendanceCreateManyInput[] = [];
  const allStudents = [
    ...classAStudents.map((s) => ({ s, cls: classA })),
    ...classBStudents.map((s) => ({ s, cls: classB })),
  ];

  for (const { s, cls } of allStudents) {
    const isRiskStudent = s.name === "Kabir Singh" || s.name === "Vikram Rao";
    for (const date of dates) {
      if (date.getUTCDay() === 0) continue;
      let status: AttendanceStatus = statuses[Math.floor(Math.random() * statuses.length)]!;
      if (isRiskStudent && Math.random() < 0.55) status = "absent";
      attendanceData.push({
        classId: cls.id,
        studentId: s.id,
        date,
        status,
        markedById: teacher.id,
        remark: status === "absent" ? "absent" : "",
      });
    }
  }

  await prisma.attendance.createMany({ data: attendanceData });

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

run().catch(async (err: unknown) => {
  console.error(err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
