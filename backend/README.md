# MarkIt backend

## Database

The server connects to `MONGO_URI` from `backend/.env` first. The current value
points at a MongoDB Atlas cluster whose hostname no longer resolves
(`markit.rvetrjb.mongodb.net`), so in development the server automatically
falls back to a **local, persistent MongoDB** instead of crashing or silently
buffering writes.

- Data folder: `backend/.data/mongo` (git-ignored)
- Local connection: `mongodb://127.0.0.1:27017/markit`
- Seed data: `npm run seed`
- Active database: `GET /api/health` returns `db.local`, `db.name`, and `db.host`

The fallback is only used when `NODE_ENV` is not `production`. Set
`DISABLE_LOCAL_DB=1` to disable it and fail fast instead.

To go back to Atlas, open `backend/.env` and replace `MONGO_URI` with the
current connection string from MongoDB Atlas (Cluster → Connect → Drivers).
Any valid `mongodb+srv://...` URI takes precedence over the local database.

## Scripts

```bash
npm run dev    # start the API with file watching
npm run start  # start the API
npm run seed   # clear and re-create the demo teacher, students and attendance
```
