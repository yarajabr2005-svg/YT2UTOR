export const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const defaultWeekStart = "2026-04-27";

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Normalize an API error for display. DRF often returns
 * { "new_password": ["..."] } or { "detail": "..." } or { "detail": [...] }.
 */
function normalizeDetail(detail) {
  if (detail == null) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "string") return x;
      return "";
    });
    return parts.filter(Boolean).join(" ");
  }
  if (typeof detail === "object" && String(detail) === "[object Object]") return null;
  return String(detail);
}

export function getErrorMessage(error, fallback = "Something went wrong.") {
  const fallbackStr = typeof fallback === "string" ? fallback : "Something went wrong.";
  const data = error?.response?.data;
  if (data == null) return fallbackStr;

  if (typeof data === "string" && data.trim()) return data;

  if (typeof data === "object" && !Array.isArray(data)) {
    if (typeof data.error === "string" && data.error.trim()) return data.error;
    if (typeof data.message === "string" && data.message.trim()) return data.message;

    const d = normalizeDetail(data.detail);
    if (d) return d;

    const fieldParts = [];
    for (const v of Object.values(data)) {
      if (Array.isArray(v)) {
        for (const item of v) {
          if (typeof item === "string" && item.trim()) fieldParts.push(item);
        }
      } else if (typeof v === "string" && v.trim()) {
        fieldParts.push(v);
      }
    }
    if (fieldParts.length) return fieldParts.join(" ");
  }

  return fallbackStr;
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

/** Parse "HH:MM" or "HH:MM:SS" to minutes from midnight. */
function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(":");
  return (Number(h) || 0) * 60 + (Number(m) || 0);
}

/** Human-readable length between two time fields from the API. */
export function formatSessionDuration(startTime, endTime) {
  const a = timeToMinutes(startTime);
  const b = timeToMinutes(endTime);
  if (b <= a) return "";
  const mins = b - a;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} min`;
}

/**
 * @param {{ booking_date: string, end_time: string }} booking
 * @returns {boolean} true if local clock is past the session end
 */
export function isPastSessionEnd(booking) {
  if (!booking?.booking_date || !booking?.end_time) return false;
  const end = new Date(`${booking.booking_date}T${String(booking.end_time).slice(0, 8)}`);
  return !Number.isNaN(end.getTime()) && Date.now() >= end.getTime();
}

/**
 * @param {string} dateStr "YYYY-MM-DD"
 */
export function isInSameCalendarWeekAsToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const start = new Date();
  const day = (start.getDay() + 6) % 7; // Mon = 0
  const monday = new Date(start.getFullYear(), start.getMonth(), start.getDate() - day, 0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return d >= monday && d < nextMonday;
}
