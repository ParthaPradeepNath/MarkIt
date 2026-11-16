# Attendance Management System

## Project Title
Attendance Management System

## Project Description
An end-to-end MERN application that lets **teachers** manage classroom attendance digitally. Teachers can create classes, enroll students, record daily attendance, correct past records, and view comprehensive student and batch-level attendance reports. Students get a read-only dashboard to track their own attendance status.

**Impact:** Eliminates manual attendance registers, reduces errors, saves teacher time, and provides instant attendance analytics.

**Real-world use cases:** Schools, colleges, and coaching centers.

---

## Tech Stack
| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React (Vite / CRA), Chart.js        |
| Backend    | Node.js + Express                   |
| Database   | MongoDB (Mongoose ODM)              |
| Auth       | JWT (JSON Web Tokens) + bcrypt      |
| Charts     | Chart.js (attendance trend reports) |

---

## Database Schema (MongoDB Collections)

### 1. `users`
Stores teachers and students who can log in.

```js
{
  name: String,
  email: String,          // unique
  password: String,       // hashed (bcrypt)
  role: "teacher" | "student",
  studentId: ObjectId,    // ref: "students" (only if role = student)
  createdAt: Date
}
```

### 2. `students`
Profile details of enrolled students.

```js
{
  name: String,
  email: String,
  rollNumber: String,        // unique per batch
  batch: String,             // e.g., "Batch A", "2024-25"
  className: ObjectId,       // ref: "classes"
  guardianPhone: String,
  createdAt: Date
}
```

### 3. `classes`
Classes created by teachers.

```js
{
  name: String,              // e.g., "Mathematics 101"
  subject: String,
  batch: String,
  teacherId: ObjectId,       // ref: "users"
  schedule: String,          // e.g., "Mon/Wed/Fri 10 AM"
  enrolledStudents: [ObjectId]  // ref: "students"
}
```

### 4. `attendance`
Daily attendance records (one record per student per class/date).

```js
{
  classId: ObjectId,         // ref: "classes"
  studentId: ObjectId,       // ref: "students"
  date: Date,
  status: "present" | "absent" | "late" | "leave",
  markedBy: ObjectId,        // ref: "users" (teacher)
  remark: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Backend API Endpoints

| Method | Endpoint                     | Description                                             | Auth |
|--------|------------------------------|---------------------------------------------------------|------|
| POST   | `/api/auth/login`            | Teacher/student login, returns JWT                      | —    |
| GET    | `/api/classes`               | List classes (filtered by teacher/student)              | JWT  |
| POST   | `/api/classes`               | Create a new class                                      | JWT  |
| GET    | `/api/students`              | List students (filter by class/batch)                   | JWT  |
| POST   | `/api/students`              | Enroll a new student                                    | JWT  |
| POST   | `/api/attendance`            | Mark attendance (bulk, for a class + date)              | JWT  |
| PUT    | `/api/attendance/:id`        | Correct/edit an existing attendance record              | JWT  |
| GET    | `/api/attendance/student/:id`| Attendance history for a single student                 | JWT  |
| GET    | `/api/reports/attendance`    | Aggregated attendance reports (student/batch/class)     | JWT  |

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

| Page                | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| Login               | JWT-based login; role-based redirect (teacher → dashboard, student → dashboard) |
| Teacher Dashboard   | Overview: class stats, today's attendance, quick actions, low-attendance alerts |
| Student Dashboard   | Personal attendance percentage, monthly trend chart (Chart.js)              |
| Students            | List/enroll students, filter by class or batch                              |
| Classes             | List/create classes, view enrolled students                                 |
| Attendance          | Records view + filter by class/date/status                                  |
| Mark Attendance     | Per-class daily marking UI (bulk present/absent toggles)                    |
| Attendance History  | Per-student or per-class history with corrections                           |
| Reports             | Attendance reports with Chart.js visualizations (student, batch, class)     |
| Profile             | View/edit own profile, change password                                      |

---

## Project Structure

```
markit/
├── backend/
│   ├── config/db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Class.js
│   │   └── Attendance.js
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
│   └── .env          # PORT, MONGO_URI, JWT_SECRET
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
- [ ] Reports with Chart.js (per-student %, batch-wise %, trend line)
- [ ] Protected routes + role guards on frontend

---

## Optional AI Enhancements
1. **Low-attendance identification** — automatically flag students below a threshold (e.g., < 75%) and surface them on the Teacher Dashboard with alerts.
2. **Attendance summaries** — generate daily/weekly/monthly summaries in natural language for teachers and parents.
3. *(Stretch)* — LLM-generated personalized notes/reminders for at-risk students.

---

## Future Scope / Extensions
- Parent portal with read-only attendance access
- QR-code / face-recognition based attendance capture
- SMS/email notifications for absenteeism
- Bulk import of students via CSV/Excel
- Leave-request approval workflow
