# MarkIt backend

Express REST API backed by PostgreSQL on Neon through Prisma ORM.

## Setup

1. Copy `.env.example` to `.env` and set at least:

   ```dotenv
   DATABASE_URL="postgresql://<user>:<password>@<host>-pooler.<region>.aws.neon.tech/<database>?sslmode=require&channel_binding=require"
   JWT_SECRET=change_me
   JWT_EXPIRES_IN=7d
   ```

   Use Neon's **pooled** connection string for `DATABASE_URL`. Prisma 5.10+
   handles pooling, so a separate unpooled URL is not required. Keep `.env`
   out of git — only `.env.example` is committed.

2. Install dependencies and apply the schema:

   ```bash
   npm install
   npm run prisma:migrate   # creates/updates tables in Neon
   ```

3. Load demo data and start the API:

   ```bash
   npm run seed
   npm run dev              # http://localhost:5000
   ```

`GET /api/health` reports the database state, provider and ORM.

## Data model

The source of truth is `prisma/schema.prisma`; committed migrations live in
`prisma/migrations/`. Key constraints:

- unique `User.email` and `Student.email`
- `Attendance` has a unique `(classId, studentId, date)` key so marking the
  same day twice upserts instead of duplicating
- `Student.classId` is the single source of truth for class membership;
  `Class.students` is its inverse relation
- removing a class clears `Student.classId` and deletes that class's
  attendance; removing a student deletes their login and attendance records

Passwords are hashed with bcrypt in `lib/user.js` before they reach Prisma —
there is no ORM `pre-save` hook.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the API with file watching |
| `npm run start` | Start the API |
| `npm run seed` | Clear and recreate demo teacher, students, classes and attendance |
| `npm run prisma:generate` | Regenerate Prisma Client after schema edits |
| `npm run prisma:migrate` | Create/apply a migration in development |
| `npm run prisma:studio` | Browse the database with Prisma Studio |
