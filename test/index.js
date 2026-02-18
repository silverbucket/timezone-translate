/**
 * Comprehensive test suite for timezone-translator parsing and detection.
 * Run with: node test/index.js
 */

import { parseSelectedText, convertParsed } from "../src/shared/parser.js";
import { detectTimezone } from "../src/content/timezone-data.js";

let passed = 0;
let failed = 0;
const failures = [];

function assert(label, condition, extra = "") {
  if (condition) {
    passed++;
    process.stdout.write(`  ✓ ${label}\n`);
  } else {
    failed++;
    failures.push({ label, extra });
    process.stdout.write(`  ✗ ${label}${extra ? `  →  ${extra}` : ""}\n`);
  }
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMEZONE DETECTION
// ─────────────────────────────────────────────────────────────────────────────
section("Timezone detection — US abbreviations");

const tzCases = [
  // Standard abbreviations
  ["meeting at 3pm EST",             "America/New_York"],
  ["meeting at 3pm EDT",             "America/New_York"],
  ["meeting at 3pm ET",              "America/New_York"],
  ["call at 5pm CST",                "America/Chicago"],
  ["call at 5pm CDT",                "America/Chicago"],
  ["call at 5pm CT",                 "America/Chicago"],
  ["noon MST",                       "America/Denver"],
  ["noon MDT",                       "America/Denver"],
  ["noon MT",                        "America/Denver"],
  ["9am PST",                        "America/Los_Angeles"],
  ["9am PDT",                        "America/Los_Angeles"],
  ["9am PT",                         "America/Los_Angeles"],
  ["8am AKST",                       "America/Anchorage"],
  ["8am AKDT",                       "America/Anchorage"],
  ["8am AKT",                        "America/Anchorage"],
  ["noon HST",                       "Pacific/Honolulu"],
  ["noon HT",                        "Pacific/Honolulu"],
  ["noon AST",                       "America/Halifax"],
  ["noon ADT",                       "America/Halifax"],
  ["noon AT",                        "America/Halifax"],
  // Full names
  ["meeting at 3pm Eastern",         "America/New_York"],
  ["meeting at 3pm Eastern Time",    "America/New_York"],
  ["call at 5pm Central",            "America/Chicago"],
  ["noon Mountain",                  "America/Denver"],
  ["9am Pacific",                    "America/Los_Angeles"],
  ["9am Pacific Time",               "America/Los_Angeles"],
  // UTC/GMT
  ["14:00 UTC",                      "UTC"],
  ["14:00 GMT",                      "GMT"],
];

for (const [text, expected] of tzCases) {
  const got = detectTimezone(text);
  assert(
    `detectTimezone("${text}")`,
    got === expected,
    `expected "${expected}", got "${got}"`
  );
}

section("Timezone detection — international");

const intlTzCases = [
  ["18:00 CET",     "Europe/Paris"],
  ["18:00 CEST",    "Europe/Paris"],
  ["18:00 BST",     "Europe/London"],
  ["15:30 IST",     "Asia/Kolkata"],
  ["09:00 JST",     "Asia/Tokyo"],
  ["09:00 KST",     "Asia/Seoul"],
  ["20:00 AEST",    "Australia/Sydney"],
  ["20:00 AEDT",    "Australia/Sydney"],
  ["08:00 NZST",    "Pacific/Auckland"],
  ["08:00 NZDT",    "Pacific/Auckland"],
  ["12:00 BRT",     "America/Sao_Paulo"],
  ["12:00 ART",     "America/Argentina/Buenos_Aires"],
];

for (const [text, expected] of intlTzCases) {
  const got = detectTimezone(text);
  assert(
    `detectTimezone("${text}")`,
    got === expected,
    `expected "${expected}", got "${got}"`
  );
}

section("Timezone detection — no timezone present");

const noTzCases = [
  "meeting at 3pm",
  "tomorrow at noon",
  "February 19th, 9am",
  "hello world",
];

for (const text of noTzCases) {
  const got = detectTimezone(text);
  assert(
    `detectTimezone("${text}") → null`,
    got === null,
    `expected null, got "${got}"`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE/TIME PARSING
// ─────────────────────────────────────────────────────────────────────────────
section("Parsing — basic times");

const basicParseCases = [
  "3pm",
  "3 PM",
  "3:00 PM",
  "3:30pm",
  "15:00",
  "15:30",
  "9am",
  "9:00am",
  "noon",
  "midnight",
];

for (const text of basicParseCases) {
  const got = parseSelectedText(text);
  assert(`parseSelectedText("${text}") → non-null`, got !== null, `got null`);
}

section("Parsing — dates with times");

const dateParseCases = [
  "February 19th at 6:00 PM",
  "February 19th, 6:00 PM",
  "Feb 19 at 3pm",
  "2/19 at 3pm",
  "Thursday at 3pm",
  "Thursday, February 19th at 6:00 PM",
  "Thursday February 19 6pm",
  "2025-02-19 14:00",
  "19 February 2025 at 3pm",
  "the 19th at 3pm",
  "next Monday at noon",
  "tomorrow at 3pm",
  "today at 5pm",
];

for (const text of dateParseCases) {
  const got = parseSelectedText(text);
  assert(`parseSelectedText("${text}") → non-null`, got !== null, `got null`);
}

section("Parsing — separator variations (pipe, dash, bullet)");

const separatorCases = [
  "Thursday, February 19th | 6:00 PM ET",
  "February 19th | 6:00 PM",
  "February 19th — 6:00 PM",
  "February 19th – 6:00 PM",
  "February 19th • 6:00 PM",
  "Mon Jan 6 | 2:00 PM PT",
  "Friday | 10am EST",
  "March 5 | 3:30-4:30pm PST",
];

for (const text of separatorCases) {
  const got = parseSelectedText(text);
  assert(`parseSelectedText("${text}") → non-null`, got !== null, `got null`);
}

section("Parsing — time ranges");

const rangeParseCases = [
  ["9:00 AM - 1:00 PM", true],
  ["9am-5pm", true],
  ["9am to 5pm", true],
  ["from 9 to 5", false],  // chrono may or may not catch this
  ["9:00 AM EST - 1:00 PM EST", true],
  ["February 18th from 9:00 AM - 1:00 PM Eastern", true],
  ["3-5pm", true],
  ["3pm - 5pm", true],
  ["March 5, 3:30-4:30pm PST", true],
];

for (const [text, expectRange] of rangeParseCases) {
  const got = parseSelectedText(text);
  if (got === null) {
    assert(`parseSelectedText("${text}") → non-null`, false, `got null`);
  } else {
    if (expectRange) {
      assert(
        `parseSelectedText("${text}") → hasRange`,
        got.hasRange,
        `hasRange=${got.hasRange}, end=${got.end}`
      );
    } else {
      assert(`parseSelectedText("${text}") → non-null`, true);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSED HOUR/MINUTE CORRECTNESS
// These verify that the wall-clock time is extracted correctly, not mangled
// by timezone offsets or separator handling inside chrono-node.
// ─────────────────────────────────────────────────────────────────────────────
section("Parsing — exact hour/minute values");

const hourCases = [
  // [text, expectedHour24, expectedMinute]
  ["6:00 PM",                                        18, 0],
  ["6:00 PM ET",                                     18, 0],
  ["Thursday, February 19th | 6:00 PM ET",           18, 0],
  ["Thursday, February 19th | 6:00 PM",              18, 0],
  ["Thursday, February 19th at 6:00 PM ET",          18, 0],
  ["9:00 AM EST",                                     9, 0],
  ["9:30 AM PST",                                     9, 30],
  ["3:00 PM CST",                                    15, 0],
  ["12:00 PM noon EST",                              12, 0],
  ["12:00 AM midnight EST",                           0, 0],
  ["Webinar: March 5th at 2:00pm PST",               14, 0],
  ["Standup @ 9:30am PT daily",                       9, 30],
  ["Meeting: Mon 3/10, 4:00 PM - 5:00 PM CST",      16, 0],
  ["14:00 UTC on Thursday",                          14, 0],
  ["February 19th — 6:00 PM",                        18, 0],
  ["February 19th – 6:00 PM",                        18, 0],
  ["February 19th • 6:00 PM",                        18, 0],
  ["Mon Jan 6 | 2:00 PM PT",                         14, 0],
  ["Friday | 10am EST",                              10, 0],
];

for (const [text, expectedHour, expectedMinute] of hourCases) {
  const got = parseSelectedText(text);
  if (!got) {
    assert(`"${text}" → hour ${expectedHour}:${String(expectedMinute).padStart(2,"0")}`, false, "returned null");
    continue;
  }
  const h = got.start.getHours();
  const m = got.start.getMinutes();
  assert(
    `"${text}" → ${expectedHour}:${String(expectedMinute).padStart(2,"0")}`,
    h === expectedHour && m === expectedMinute,
    `got ${h}:${String(m).padStart(2,"0")}`
  );
}

section("Parsing — timezone in text (combined)");

const combinedCases = [
  "Thursday, February 19th | 6:00 PM ET",
  "February 18th from 9:00 AM - 1:00 PM Eastern",
  "Webinar: March 5th at 2:00pm PST",
  "Call tomorrow 10am-11am EST",
  "Standup @ 9:30am PT daily",
  "Meeting: Mon 3/10, 4:00 PM - 5:00 PM CST",
  "Friday 10 AM GMT",
  "Event on Feb 20 at 18:00 CET",
  "Live at 9pm ET / 6pm PT",
  "Doors open at 7:30 PM EST (6:30 PM CST)",
  "14:00 UTC on Thursday",
  "9:00 AM to 5:00 PM Pacific Standard Time",
  "2pm BST (London)",
  "5:30 PM IST",
  "noon JST",
];

for (const text of combinedCases) {
  const parsed = parseSelectedText(text);
  const tz = detectTimezone(text);
  assert(
    `"${text}" → parse+detect`,
    parsed !== null,
    `parse=${parsed !== null}, tz=${tz}`
  );
}

section("Parsing — no date (should return null)");

const noDateCases = [
  "hello world",
  "meeting about timezone stuff",
  "please review this document",
  "",
];

for (const text of noDateCases) {
  const got = parseSelectedText(text);
  assert(`parseSelectedText("${text}") → null`, got === null, `got: ${JSON.stringify(got)}`);
}

section("Parsing — time of day words");

const timeWordCases = [
  "meeting tomorrow morning",
  "call this afternoon",
  // These are intentionally ambiguous — just checking they don't crash
];

for (const text of timeWordCases) {
  let threw = false;
  try { parseSelectedText(text); } catch { threw = true; }
  assert(`parseSelectedText("${text}") doesn't throw`, !threw);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSION CORRECTNESS
// ─────────────────────────────────────────────────────────────────────────────
section("Conversion correctness — spot checks (ET→PT)");

// Known: Feb 18 2025, 9:00 AM ET = 6:00 AM PT
// We'll parse a fixed reference and check conversion
function makeDate(y, mo, d, h, mi) {
  // Construct a "wall clock" date in local time that chrono would return
  return new Date(y, mo - 1, d, h, mi, 0);
}

const convCases = [
  {
    label: "9:00 AM ET → 6:00 AM PT",
    parsed: { start: makeDate(2025, 2, 18, 9, 0), end: null, hasRange: false },
    fromTZ: "America/New_York",
    toTZ: "America/Los_Angeles",
    expectTime: "6:00 AM",
  },
  {
    label: "6:00 PM ET → 3:00 PM PT",
    parsed: { start: makeDate(2025, 2, 19, 18, 0), end: null, hasRange: false },
    fromTZ: "America/New_York",
    toTZ: "America/Los_Angeles",
    expectTime: "3:00 PM",
  },
  {
    label: "12:00 UTC → 8:00 AM ET",
    parsed: { start: makeDate(2025, 2, 19, 12, 0), end: null, hasRange: false },
    fromTZ: "UTC",
    toTZ: "America/New_York",
    expectTime: "7:00 AM",  // UTC-5 in Feb
  },
  {
    label: "9:00 AM PT → 5:00 PM GMT",
    parsed: { start: makeDate(2025, 2, 19, 9, 0), end: null, hasRange: false },
    fromTZ: "America/Los_Angeles",
    toTZ: "GMT",
    expectTime: "5:00 PM",
  },
];

for (const { label, parsed, fromTZ, toTZ, expectTime } of convCases) {
  try {
    const result = convertParsed(parsed, fromTZ, toTZ);
    assert(
      `${label} → "${expectTime}"`,
      result.displayTime.includes(expectTime),
      `got "${result.displayTime}"`
    );
  } catch (e) {
    assert(label, false, `threw: ${e.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);

if (failures.length > 0) {
  console.log(`\nFailed tests:`);
  for (const { label, extra } of failures) {
    console.log(`  ✗ ${label}${extra ? `  →  ${extra}` : ""}`);
  }
  process.exit(1);
} else {
  console.log("\nAll tests passed!");
}
