import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Always load backend/.env, no matter which directory the process was started
// from. Existing environment variables still take precedence, which is what you
// want in production or when running behind a process manager.
const backendDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

dotenv.config({ path: path.join(backendDir, ".env") });
