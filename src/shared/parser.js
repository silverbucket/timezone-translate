import * as chrono from "chrono-node";

/**
 * Replace non-standard separators that chrono-node can't bridge
 * (pipe, em-dash, bullet) with a comma so the full date+time expression
 * is parsed as one unit. En-dash is left alone — chrono uses it for ranges.
 */
function normalizeForChrono(text) {
  return text
    .replace(/[|—•]/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extract wall-clock date components from a chrono ParsedComponents object
 * without applying any timezone offset chrono may have detected.
 *
 * IMPORTANT: chrono returns `get('hour')` in 12-hour format when AM/PM is
 * present. We must apply `meridiem` ourselves to get the 24-hour value.
 * Falls back to sensible defaults (today's date, noon) for missing parts.
 */
function componentsToWallClock(components, ref) {
  const now = ref ?? new Date();
  const year   = components.get("year")   ?? now.getFullYear();
  const month  = (components.get("month") ?? (now.getMonth() + 1)) - 1; // 0-indexed
  const day    = components.get("day")    ?? now.getDate();
  let   hour   = components.get("hour")   ?? 12;
  const minute = components.get("minute") ?? 0;
  const second = components.get("second") ?? 0;

  // chrono's meridiem: 0 = AM, 1 = PM
  const meridiem = components.get("meridiem");
  if (meridiem === 1 && hour < 12) hour += 12;  // e.g. 6 PM → 18
  if (meridiem === 0 && hour === 12) hour = 0;   // 12 AM (midnight) → 0

  return new Date(year, month, day, hour, minute, second);
}

/**
 * chrono-node parses text as wall-clock values in the *local* timezone.
 * This function takes those wall-clock components (year, month, day, hour,
 * minute, second) and reinterprets them as being in `fromTZ`, returning
 * the true UTC instant.
 *
 * Strategy: use Intl.DateTimeFormat to find the UTC offset that applies
 * in `fromTZ` at approximately the right moment, then adjust.
 *
 * @param {Date} parsedDate  - Wall-clock Date (local-time components only)
 * @param {string} fromTZ    - IANA timezone string (e.g. "America/New_York")
 * @returns {Date}           - The true UTC instant
 */
function wallClockToUTC(parsedDate, fromTZ) {
  // Extract the wall-clock components from the date
  const y = parsedDate.getFullYear();
  const mo = parsedDate.getMonth() + 1;
  const d = parsedDate.getDate();
  const h = parsedDate.getHours();
  const mi = parsedDate.getMinutes();
  const s = parsedDate.getSeconds();

  // Build an ISO string that we'll parse as UTC to get a first estimate
  const isoStr = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${String(s).padStart(2, "0")}Z`;
  const utcEstimate = new Date(isoStr);

  // Get the offset (in minutes) that fromTZ applies at this estimated UTC moment
  const offset = getUtcOffset(utcEstimate, fromTZ);

  // True UTC = wall-clock - offset
  return new Date(utcEstimate.getTime() - offset * 60 * 1000);
}

/**
 * Get the UTC offset (in minutes) for a given IANA timezone at a given UTC moment.
 * Positive means ahead of UTC (e.g. UTC+5 → 300), negative means behind (e.g. UTC-5 → -300).
 *
 * @param {Date} utcDate
 * @param {string} tz - IANA timezone string
 * @returns {number} offset in minutes
 */
function getUtcOffset(utcDate, tz) {
  // Format the date in the target timezone and in UTC, then diff
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(utcDate);
  const get = (type) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  let h = get("hour");
  // Intl sometimes returns 24 for midnight
  if (h === 24) h = 0;

  const localInTz = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    h,
    get("minute"),
    get("second")
  );

  return (localInTz - utcDate.getTime()) / 60000;
}

/**
 * Convert a parsed date from one IANA timezone to another.
 *
 * @param {Date} parsedDate - Wall-clock Date from chrono-node
 * @param {string} fromTZ   - Source IANA timezone
 * @param {string} toTZ     - Target IANA timezone
 * @returns {{ date: Date, formatted: string }}
 */
export function convertTime(parsedDate, fromTZ, toTZ) {
  const utc = wallClockToUTC(parsedDate, fromTZ);

  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: toTZ,
    weekday: undefined,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "long",
  }).format(utc);

  return { date: utc, formatted };
}

/**
 * Format a single converted time for display (no date, just time + TZ name).
 *
 * @param {Date} utcDate
 * @param {string} toTZ
 * @returns {string}
 */
export function formatTime(utcDate, toTZ) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: toTZ,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(utcDate);
}

/**
 * Format a date+time for display in a given timezone.
 *
 * @param {Date} utcDate
 * @param {string} toTZ
 * @returns {string}
 */
export function formatDateTime(utcDate, toTZ) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: toTZ,
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "long",
  }).format(utcDate);
}

/**
 * Parse selected text using chrono-node.
 * Returns null if no date/time found.
 *
 * Normalizes the text first (separators, TZ stripping) so chrono-node
 * sees a clean expression and doesn't pre-apply timezone offsets.
 * Uses raw parsed components (not .date()) to preserve wall-clock values.
 *
 * @param {string} text
 * @returns {{ start: Date, end: Date|null, hasRange: boolean } | null}
 */
export function parseSelectedText(text) {
  const ref = new Date();
  const normalized = normalizeForChrono(text);
  const results = chrono.parse(normalized, ref, { forwardDate: false });

  if (!results || results.length === 0) return null;

  const result = results[0];
  // Use raw component values, not .date(), to avoid double TZ adjustment
  const start = componentsToWallClock(result.start, ref);
  const end = result.end ? componentsToWallClock(result.end, ref) : null;

  return {
    start,
    end,
    hasRange: end !== null,
  };
}

/**
 * Convert a parsed date range from fromTZ to toTZ and produce display strings.
 *
 * @param {{ start: Date, end: Date|null, hasRange: boolean }} parsed
 * @param {string} fromTZ
 * @param {string} toTZ
 * @returns {{ startUTC: Date, endUTC: Date|null, displayDate: string, displayTime: string, displayTZ: string }}
 */
export function convertParsed(parsed, fromTZ, toTZ) {
  const startUTC = wallClockToUTC(parsed.start, fromTZ);
  const endUTC = parsed.end ? wallClockToUTC(parsed.end, fromTZ) : null;

  // Date label (use start date in toTZ)
  const displayDate = new Intl.DateTimeFormat("en-US", {
    timeZone: toTZ,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(startUTC);

  // Time range
  const startTimeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: toTZ,
    hour: "numeric",
    minute: "2-digit",
  });
  const endTimeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: toTZ,
    hour: "numeric",
    minute: "2-digit",
  });

  const startTimeStr = startTimeFmt.format(startUTC);
  const endTimeStr = endUTC ? endTimeFmt.format(endUTC) : null;
  const displayTime = endTimeStr ? `${startTimeStr} – ${endTimeStr}` : startTimeStr;

  // Long timezone name
  const displayTZ = new Intl.DateTimeFormat("en-US", {
    timeZone: toTZ,
    timeZoneName: "long",
  })
    .formatToParts(startUTC)
    .find((p) => p.type === "timeZoneName")?.value ?? toTZ;

  return { startUTC, endUTC, displayDate, displayTime, displayTZ };
}
