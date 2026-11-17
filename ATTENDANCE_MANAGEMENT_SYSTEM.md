# Attendance Management System

## Project Title

Attendance Management System

## Project Description

An end-to-end React + Express application backed by PostgreSQL (Neon) through Prisma ORM that lets **teachers** manage classroom attendance digitally. Teachers can create classes, enroll students, record daily attendance, correct past records, and view comprehensive student and batch-level attendance reports. Students get a read-only dashboard to track their own attendance status.

**Impact:** Eliminates manual attendance registers, reduces errors, saves teacher time, and provides instant attendance analytics.

**Real-world use cases:** Schools, colleges, and coaching centers.

---

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React + Vite                        |
| Backend  | Node.js + Express                   |
| Database | PostgreSQL (Neon) + Prisma ORM      |
| Auth     | JWT (JSON Web Tokens) + bcrypt      |
| Charts   | Recharts (attendance trend reports) |

---

## Database Schema (PostgreSQL / Prisma)

The authoritative schema lives in `backend/prisma/schema.prisma` and is applied
with Prisma Migrate. IDs are `cuid()` strings; relations are explicit.

### 1. `User`

Teachers and students who can log in.

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String              // bcrypt hash
  role      Role                 // teacher | student
  studentId String?  @unique
  student   Student? @relation(fields: [studentId], references: [id])
  // ...timestamps and back-relations
}
```

### 2. `Student`

Profile details of enrolled students. One class per student via `classId`.

```prisma
model Student {
  id            String  @id @default(cuid())
  name          String
  email         String  @unique
  rollNumber    String
  batch         String
  classId       String?
  class         Class?  @relation(fields: [classId], references: [id])
  guardianPhone String?
  // ...timestamps and back-relations
}
```

### 3. `Class`

Classes created by teachers. Enrolled students are the inverse of
`Student.class`, exposed as `students`.

```prisma
model Class {
  id        String   @id @default(cuid())
  name      String
  subject   String
  batch     String
  teacherId String
  teacher   User     @relation(fields: [teacherId], references: [id])
  schedule  String?
  students  Student[]
  // ...timestamps and back-relations
}
```

### 4. `Attendance`

Daily attendance records (one record per student per class per day).

```prisma
model Attendance {
  id         String          @id @default(cuid())
  classId    String
  studentId  String
  date       DateTime        @db.Date
  status     AttendanceStatus // present | absent | late | leave
  markedById String
  remark     String?
  @@unique([classId, studentId, date])
  // ...timestamps and relations
}
```

---

## Backend API Endpoints

| Method | Endpoint                      | Description                                         | Auth |
| ------ | ----------------------------- | --------------------------------------------------- | ---- |
| POST   | `/api/auth/login`             | Teacher/student login, returns JWT                  | —    |
| GET    | `/api/classes`                | List classes (filtered by teacher/student)          | JWT  |
| POST   | `/api/classes`                | Create a new class                                  | JWT  |
| GET    | `/api/students`               | List students (filter by class/batch)               | JWT  |
| POST   | `/api/students`               | Enroll a new student                                | JWT  |
| POST   | `/api/attendance`             | Mark attendance (bulk, for a class + date)          | JWT  |
| PUT    | `/api/attendance/:id`         | Correct/edit an existing attendance record          | JWT  |
| GET    | `/api/attendance/student/:id` | Attendance history for a single student             | JWT  |
| GET    | `/api/reports/attendance`     | Aggregated attendance reports (student/batch/class) | JWT  |

### Example Requests

**Login**

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "teacher@school.com", "password": "secret" }
```

**Mark Attendance (bulk)**

```http
POST /api/attendance
Authorization: Bearer <JWT>

{
  "classId": "64abc...",
  "date": "2026-08-16",
  "records": [
    { "studentId": "64def...", "status": "present" },
    { "studentId": "64ghi...", "status": "absent", "remark": "sick" }
  ]
}
```

**Correct a record**

```http
PUT /api/attendance/64xyz...
Authorization: Bearer <JWT>

{ "status": "present", "remark": "corrected on request" }
```

---

## Frontend Pages

| Page               | Description                                                                     |
| ------------------ | ------------------------------------------------------------------------------- |
| Login              | JWT-based login; role-based redirect (teacher → dashboard, student → dashboard) |
| Teacher Dashboard  | Overview: class stats, today's attendance, quick actions, low-attendance alerts |
| Student Dashboard  | Personal attendance percentage, monthly trend chart (Recharts)                  |
| Students           | List/enroll students, filter by class or batch                                  |
| Classes            | List/create classes, view enrolled students                                     |
| Attendance         | Records view + filter by class/date/status                                      |
| Mark Attendance    | Per-class daily marking UI (bulk present/absent toggles)                        |
| Attendance History | Per-student or per-class history with corrections                               |
| Reports            | Attendance reports with Recharts visualizations (student, batch, class)         |
| Profile            | View/edit own profile, change password                                          |

---

## Project Structure

```
markit/
├── backend/
│   ├── config/db.js          # Prisma client + connection helpers
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── lib/user.js           # password hashing helpers
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── classes.js
│   │   ├── students.js
│   │   ├── attendance.js
│   │   └── reports.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── classController.js
│   │   ├── studentController.js
│   │   ├── attendanceController.js
│   │   └── reportController.js
│   ├── server.js
│   ├── seed.js       # demo data (npm run seed)
│   └── .env          # DATABASE_URL, PORT, JWT_SECRET
└── frontend/
    ├── src/
    │   ├── api/          # axios service + auth interceptor
    │   ├── context/AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── TeacherDashboard.jsx
    │   │   ├── StudentDashboard.jsx
    │   │   ├── Students.jsx
    │   │   ├── Classes.jsx
    │   │   ├── Attendance.jsx
    │   │   ├── MarkAttendance.jsx
    │   │   ├── AttendanceHistory.jsx
    │   │   ├── Reports.jsx
    │   │   └── Profile.jsx
    │   ├── components/
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## Feature Checklist

- [ ] Teacher & student login (JWT + bcrypt, role-based access)
- [ ] Teacher creates classes and enrolls students
- [ ] Bulk daily attendance marking per class
- [ ] Edit/correct attendance records (PUT `/api/attendance/:id`)
- [ ] Student attendance history view
- [ ] Reports with Recharts (per-student %, batch-wise %, trend line)
- [ ] Protected routes + role guards on frontend

---

## Optional AI Enhancements

1. **Low-attendance identification** — automatically flag students below a threshold (e.g., < 75%) and surface them on the Teacher Dashboard with alerts.
2. **Attendance summaries** — generate daily/weekly/monthly summaries in natural language for teachers and parents.
3. _(Stretch)_ — LLM-generated personalized notes/reminders for at-risk students.

---

## Future Scope / Extensions

- Parent portal with read-only attendance access
- QR-code / face-recognition based attendance capture
- SMS/email notifications for absenteeism
- Bulk import of students via CSV/Excel
- Leave-request approval workflow
