# MarkIt backend

Express REST API backed by PostgreSQL on Neon through Prisma ORM.

## Setup

1. Copy `.env.example` to `.env` and set at least:

   ```dotenv
   DATABASE_URL="postgresql://<user>:<password>@<host>-pooler.<region>.aws.neon.tech/<database>?sslmode=verify-full&channel_binding=require"
   JWT_SECRET=change_me
   JWT_EXPIRES_IN=7d
   ```

   Use Neon's **pooled** connection string for `DATABASE_URL`. Prisma 7 connects
   through the `@prisma/adapter-pg` driver adapter, so `pg` owns the connection
   pool and a separate unpooled URL is not required. Keep `.env` out of git —
   only `.env.example` is committed.

2. Install dependencies and apply the schema:

   ```bash
   bun install              # postinstall generates the Prisma 7 client
   bun run prisma:migrate   # creates/updates tables in Neon
   ```

3. Load demo data and start the API:

   ```bash
   bun run seed
   bun run dev              # http://localhost:5000
   ```

`GET /api/health` reports the database state, provider and ORM.

Prisma 7 reads the CLI connection URL from `prisma.config.ts` and the runtime
adapter from `config/db.ts`. The generated client is written to the gitignored
`generated/prisma/` directory; run `bun run prisma:generate` after schema edits.

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

Passwords are hashed with bcrypt in `lib/user.ts` before they reach Prisma —
there is no ORM `pre-save` hook.

## Scripts

| Command                   | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `bun run dev`             | Start the API with file watching                                  |
| `bun run start`           | Start the API                                                     |
| `bun run typecheck`       | Type-check all backend TypeScript                                 |
| `bun run seed`            | Clear and recreate demo teacher, students, classes and attendance |
| `bun run prisma:generate` | Regenerate Prisma Client after schema edits                       |
| `bun run prisma:migrate`  | Create/apply a migration in development                           |
| `bun run prisma:studio`   | Browse the database with Prisma Studio                            |
