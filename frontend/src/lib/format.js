import { format } from "date-fns";

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  return error?.response?.data?.message || error?.message || fallback;
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
