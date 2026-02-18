import { parseSelectedText } from "../shared/parser.js";
import { detectTimezone } from "./timezone-data.js";
import { showDialog } from "./dialog.js";

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "TRANSLATE_TIMEZONE") return;

  const { selectedText } = message;
  if (!selectedText) return;

  const parsed = parseSelectedText(selectedText);
  const detectedTZ = detectTimezone(selectedText);

  showDialog({ selectedText, parsed, detectedTZ });
});
