import { format } from "date-fns";

// Raw axios/server strings are for logs, not for people. Map the ones we know
// to plain language, and never let technical noise reach the screen.
const friendlyErrors = [
  [/invalid email or password|invalid credentials/i, "That email or password doesn't look right. Please try again."],
  [/current password is incorrect/i, "Your current password isn't correct. Please try again."],
  [/already exists|duplicate/i, "Something with those details already exists. Try different information."],
  [/not authorized|unauthorized|token failed|jwt malformed/i, "Your session has expired. Please sign in again."],
  [/forbidden|not permitted/i, "You don't have permission to do that."],
  [/route not found|not found/i, "We couldn't find what you were looking for."],
  [/network error|networkerror|failed to fetch|econnrefused|enotfound|getaddrinfo/i, "We couldn't reach the server. Check your connection and try again."],
  [/timeout|timed out|etimedout/i, "The request took too long. Please try again."],
  [/ssl|tls|certificate|mongo|database/i, "We're having trouble connecting right now. Please try again shortly."],
  [/status code 500|internal server error/i, "Something went wrong on our end. Please try again in a moment."],
  [/status code 503|service unavailable/i, "The service is temporarily unavailable. Please try again shortly."],
];

const looksTechnical = (message) =>
  /error:|status code|^\s*at\s|econn|enotfound|getaddrinfo|mongo|ssl|tls|certificate/i.test(message);

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const raw = error?.response?.data?.message || error?.message || "";
  const friendly = friendlyErrors.find(({ pattern }) => pattern.test(raw));
  if (friendly) return friendly;
  return raw && !looksTechnical(raw) ? raw : fallback;
}

export function initials(name = "U") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function firstName(name = "") {
  return String(name).trim().split(/\s+/)[0] || "there";
}

export function formatDate(value, pattern = "MMM d, yyyy") {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, pattern);
}

export function formatMonth(value) {
  if (!value) return "";
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "MMM");
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function percent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : 0;
}
