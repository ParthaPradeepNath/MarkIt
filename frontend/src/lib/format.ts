import { format } from "date-fns";

// Raw axios/server strings are for logs, not for people. Map the ones we know
// to plain language, and never let technical noise reach the screen.
const friendlyErrors: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /invalid email or password|invalid credentials/i,
    message: "That email or password doesn't look right. Please try again.",
  },
  {
    pattern: /current password is incorrect/i,
    message: "Your current password isn't correct. Please try again.",
  },
  {
    pattern: /already exists|duplicate/i,
    message:
      "Something with those details already exists. Try different information.",
  },
  {
    pattern: /not authorized|unauthorized|token failed|jwt malformed/i,
    message: "Your session has expired. Please sign in again.",
  },
  {
    pattern: /forbidden|not permitted/i,
    message: "You don't have permission to do that.",
  },
  {
    pattern: /route not found|not found/i,
    message: "We couldn't find what you were looking for.",
  },
  {
    pattern:
      /network error|networkerror|failed to fetch|econnrefused|enotfound|getaddrinfo/i,
    message:
      "We couldn't reach the server. Check your connection and try again.",
  },
  {
    pattern: /timeout|timed out|etimedout/i,
    message: "The request took too long. Please try again.",
  },
  {
    pattern: /ssl|tls|certificate|mongo|database/i,
    message:
      "We're having trouble connecting right now. Please try again shortly.",
  },
  {
    pattern: /status code 500|internal server error/i,
    message: "Something went wrong on our end. Please try again in a moment.",
  },
  {
    pattern: /status code 503|service unavailable/i,
    message:
      "The service is temporarily unavailable. Please try again shortly.",
  },
];

const looksTechnical = (message: string) =>
  /error:|status code|^\s*at\s|econn|enotfound|getaddrinfo|mongo|ssl|tls|certificate/i.test(
    message
  );

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const apiError = error as ApiError | null | undefined;
  const raw = apiError?.response?.data?.message || apiError?.message || "";
  const friendly = friendlyErrors.find(({ pattern }) => pattern.test(raw));
  if (friendly) return friendly.message;
  return raw && !looksTechnical(raw) ? raw : fallback;
}

export function initials(name: string | null | undefined = "U"): string {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function firstName(name: string | null | undefined = ""): string {
  return String(name).trim().split(/\s+/)[0] || "there";
}

export function formatDate(
  value: string | Date | null | undefined,
  pattern = "MMM d, yyyy"
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, pattern);
}

export function formatMonth(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "MMM");
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function plural(
  count: number,
  singular: string,
  pluralForm = `${singular}s`
): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
