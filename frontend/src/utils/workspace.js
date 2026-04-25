export const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const defaultWeekStart = "2026-04-27";

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getErrorMessage(error, fallback) {
  return error?.response?.data?.error || error?.response?.data?.detail || fallback;
}

export function formatTime(value) {
  if (!value) return "";
  const [hourRaw, minute = "00"] = String(value).split(":");
  const hour = Number(hourRaw);
  if (Number.isNaN(hour)) return value;
  const period = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${minute} ${period}`;
}

export function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getInitials(user) {
  const source = user?.username || user?.email || "YT";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function money(value) {
  if (value === null || value === undefined || value === "") return "$0";
  return `$${Number(value).toLocaleString()}`;
}
