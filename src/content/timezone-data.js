// Maps timezone abbreviations and plain English names to IANA timezone strings.
// Order matters — more specific patterns first.

export const TIMEZONE_MAP = new Map([
  // US timezones — long forms first (regex matches longest first)
  ["Eastern Standard Time", "America/New_York"],
  ["Eastern Daylight Time", "America/New_York"],
  ["Eastern Time", "America/New_York"],
  ["Eastern", "America/New_York"],
  ["EST", "America/New_York"],
  ["EDT", "America/New_York"],
  ["ET", "America/New_York"],

  ["Central Standard Time", "America/Chicago"],
  ["Central Daylight Time", "America/Chicago"],
  ["Central Time", "America/Chicago"],
  ["Central", "America/Chicago"],
  ["CST", "America/Chicago"],
  ["CDT", "America/Chicago"],
  ["CT", "America/Chicago"],

  ["Mountain Standard Time", "America/Denver"],
  ["Mountain Daylight Time", "America/Denver"],
  ["Mountain Time", "America/Denver"],
  ["Mountain", "America/Denver"],
  ["MST", "America/Denver"],
  ["MDT", "America/Denver"],
  ["MT", "America/Denver"],

  ["Pacific Standard Time", "America/Los_Angeles"],
  ["Pacific Daylight Time", "America/Los_Angeles"],
  ["Pacific Time", "America/Los_Angeles"],
  ["Pacific", "America/Los_Angeles"],
  ["PST", "America/Los_Angeles"],
  ["PDT", "America/Los_Angeles"],
  ["PT", "America/Los_Angeles"],

  ["Alaska Standard Time", "America/Anchorage"],
  ["Alaska Daylight Time", "America/Anchorage"],
  ["Alaska Time", "America/Anchorage"],
  ["Alaska", "America/Anchorage"],
  ["AKST", "America/Anchorage"],
  ["AKDT", "America/Anchorage"],
  ["AKT", "America/Anchorage"],

  ["Hawaii Standard Time", "Pacific/Honolulu"],
  ["Hawaii Time", "Pacific/Honolulu"],
  ["Hawaii", "Pacific/Honolulu"],
  ["HST", "Pacific/Honolulu"],
  ["HT", "Pacific/Honolulu"],

  ["Atlantic Standard Time", "America/Halifax"],
  ["Atlantic Daylight Time", "America/Halifax"],
  ["Atlantic Time", "America/Halifax"],
  ["Atlantic", "America/Halifax"],
  ["AST", "America/Halifax"],
  ["ADT", "America/Halifax"],
  ["AT", "America/Halifax"],

  // UTC / GMT
  ["UTC", "UTC"],
  ["GMT", "GMT"],

  // Europe
  ["Central European Summer Time", "Europe/Paris"],
  ["Central European Time", "Europe/Paris"],
  ["CEST", "Europe/Paris"],
  ["CET", "Europe/Paris"],

  ["British Summer Time", "Europe/London"],
  ["British", "Europe/London"],
  ["BST", "Europe/London"],

  ["Western European Summer Time", "Europe/Lisbon"],
  ["Western European Time", "Europe/Lisbon"],
  ["WEST", "Europe/Lisbon"],
  ["WET", "Europe/Lisbon"],

  ["Eastern European Summer Time", "Europe/Helsinki"],
  ["Eastern European Time", "Europe/Helsinki"],
  ["EEST", "Europe/Helsinki"],
  ["EET", "Europe/Helsinki"],

  // Asia
  ["IST", "Asia/Kolkata"],
  ["India", "Asia/Kolkata"],
  ["Indian Standard Time", "Asia/Kolkata"],

  ["JST", "Asia/Tokyo"],
  ["Japan", "Asia/Tokyo"],
  ["Japan Standard Time", "Asia/Tokyo"],

  ["KST", "Asia/Seoul"],
  ["Korea", "Asia/Seoul"],
  ["Korea Standard Time", "Asia/Seoul"],

  ["CST+8", "Asia/Shanghai"],
  ["China", "Asia/Shanghai"],
  ["China Standard Time", "Asia/Shanghai"],

  ["SGT", "Asia/Singapore"],
  ["Singapore", "Asia/Singapore"],
  ["Singapore Time", "Asia/Singapore"],

  ["HKT", "Asia/Hong_Kong"],
  ["Hong Kong", "Asia/Hong_Kong"],

  ["ICT", "Asia/Bangkok"],
  ["Indochina", "Asia/Bangkok"],

  ["PKT", "Asia/Karachi"],
  ["Pakistan", "Asia/Karachi"],

  // Australia
  ["AEST", "Australia/Sydney"],
  ["AEDT", "Australia/Sydney"],
  ["Australian Eastern Time", "Australia/Sydney"],
  ["Australian Eastern Standard Time", "Australia/Sydney"],
  ["Australian Eastern Daylight Time", "Australia/Sydney"],

  ["ACST", "Australia/Adelaide"],
  ["ACDT", "Australia/Adelaide"],
  ["Australian Central Time", "Australia/Adelaide"],

  ["AWST", "Australia/Perth"],
  ["Australian Western Time", "Australia/Perth"],
  ["Australian Western Standard Time", "Australia/Perth"],

  // Pacific
  ["NZST", "Pacific/Auckland"],
  ["NZDT", "Pacific/Auckland"],
  ["New Zealand", "Pacific/Auckland"],
  ["New Zealand Standard Time", "Pacific/Auckland"],
  ["New Zealand Daylight Time", "Pacific/Auckland"],

  // South America
  ["BRT", "America/Sao_Paulo"],
  ["Brazil", "America/Sao_Paulo"],
  ["Brasilia", "America/Sao_Paulo"],

  ["ART", "America/Argentina/Buenos_Aires"],
  ["Argentina", "America/Argentina/Buenos_Aires"],
]);

// Sorted by length descending so longer/more-specific phrases match first
const SORTED_KEYS = [...TIMEZONE_MAP.keys()].sort((a, b) => b.length - a.length);

// Regex built from all keys (escaped), longest first.
// \b word boundaries prevent matching abbreviations inside words
// (e.g. "EET" must not match inside "meeting").
// Uses global flag so detectTimezone can iterate through all matches.
const TIMEZONE_REGEX = new RegExp(
  SORTED_KEYS.map((k) => `\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).join("|"),
  "gi"
);

/**
 * Returns true if the raw matched string could be a false positive.
 * Short single-word matches (like "at", "et", "in") must be ALL-CAPS
 * to be accepted as timezone abbreviations — people write EST/PT/UTC
 * in uppercase; common English words are lowercase.
 */
function isFalsePositive(raw) {
  const isShortWord = raw.length <= 5 && !raw.includes(" ");
  return isShortWord && raw !== raw.toUpperCase();
}

/**
 * Detect a timezone mentioned in the given text.
 * Iterates through all regex matches and returns the first valid one,
 * skipping lowercase short words that are common English false positives.
 * @param {string} text
 * @returns {string|null} IANA timezone string or null
 */
export function detectTimezone(text) {
  // Reset lastIndex since the regex has the global flag
  TIMEZONE_REGEX.lastIndex = 0;

  let match;
  while ((match = TIMEZONE_REGEX.exec(text)) !== null) {
    const raw = match[0];

    if (isFalsePositive(raw)) continue;

    const lc = raw.toLowerCase();
    for (const key of SORTED_KEYS) {
      if (key.toLowerCase() === lc) {
        return TIMEZONE_MAP.get(key);
      }
    }
  }

  return null;
}

/**
 * All IANA timezone identifiers supported by the browser's Intl API,
 * grouped for display in the dropdown.
 */
export const ALL_TIMEZONES = [
  // UTC
  "UTC",
  // Americas
  "America/Adak",
  "America/Anchorage",
  "America/Boise",
  "America/Chicago",
  "America/Denver",
  "America/Detroit",
  "America/Halifax",
  "America/Indiana/Indianapolis",
  "America/Indiana/Knox",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Tell_City",
  "America/Indiana/Vevay",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Juneau",
  "America/Kentucky/Louisville",
  "America/Kentucky/Monticello",
  "America/Los_Angeles",
  "America/Menominee",
  "America/Metlakatla",
  "America/New_York",
  "America/Nome",
  "America/North_Dakota/Beulah",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/Phoenix",
  "America/Puerto_Rico",
  "America/Sitka",
  "America/St_Thomas",
  "America/Yakutat",
  "Pacific/Honolulu",
  "Pacific/Midway",
  "Pacific/Pago_Pago",
  // Canada
  "America/Toronto",
  "America/Vancouver",
  "America/Winnipeg",
  "America/Edmonton",
  "America/Regina",
  "America/St_Johns",
  // Mexico / Central America
  "America/Mexico_City",
  "America/Cancun",
  "America/Monterrey",
  "America/Bogota",
  "America/Lima",
  "America/Caracas",
  // South America
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  // Atlantic
  "Atlantic/Azores",
  "Atlantic/Cape_Verde",
  "Atlantic/Reykjavik",
  // Europe
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Vienna",
  "Europe/Zurich",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Copenhagen",
  "Europe/Warsaw",
  "Europe/Prague",
  "Europe/Budapest",
  "Europe/Bucharest",
  "Europe/Sofia",
  "Europe/Athens",
  "Europe/Helsinki",
  "Europe/Riga",
  "Europe/Tallinn",
  "Europe/Vilnius",
  "Europe/Kiev",
  "Europe/Minsk",
  "Europe/Moscow",
  "Europe/Samara",
  "Europe/Istanbul",
  // Africa
  "Africa/Abidjan",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  // Middle East
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Baghdad",
  "Asia/Tehran",
  "Asia/Jerusalem",
  "Asia/Beirut",
  "Asia/Kuwait",
  "Asia/Qatar",
  // Asia
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Colombo",
  "Asia/Dhaka",
  "Asia/Kathmandu",
  "Asia/Almaty",
  "Asia/Tashkent",
  "Asia/Yekaterinburg",
  "Asia/Omsk",
  "Asia/Krasnoyarsk",
  "Asia/Novosibirsk",
  "Asia/Bangkok",
  "Asia/Ho_Chi_Minh",
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Kuala_Lumpur",
  "Asia/Manila",
  "Asia/Makassar",
  "Asia/Irkutsk",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Yakutsk",
  "Asia/Vladivostok",
  "Asia/Magadan",
  "Asia/Kamchatka",
  "Asia/Sakhalin",
  // Australia & Pacific
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Darwin",
  "Australia/Brisbane",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Hobart",
  "Australia/Lord_Howe",
  "Pacific/Auckland",
  "Pacific/Chatham",
  "Pacific/Fiji",
  "Pacific/Guam",
  "Pacific/Noumea",
  "Pacific/Port_Moresby",
  "Pacific/Tongatapu",
];
