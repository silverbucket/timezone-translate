import { ALL_TIMEZONES } from "./timezone-data.js";
import { convertParsed } from "../shared/parser.js";

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :host {
    all: initial;
    display: block;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 2147483646;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .dialog {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.25);
    width: 480px;
    max-width: calc(100vw - 32px);
    overflow: hidden;
    z-index: 2147483647;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #1a1a2e;
    color: #fff;
  }

  .header h2 {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .close-btn {
    background: none;
    border: none;
    color: #aaa;
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 4px;
    transition: color 0.15s;
  }
  .close-btn:hover { color: #fff; }

  .body {
    padding: 16px;
  }

  .selected-text {
    font-size: 13px;
    color: #555;
    font-style: italic;
    background: #f5f5f7;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .selected-text strong {
    color: #333;
    font-style: normal;
    font-weight: 500;
  }

  .parsed-summary {
    font-size: 12px;
    color: #777;
    margin-bottom: 14px;
  }
  .parsed-summary span {
    font-weight: 500;
    color: #444;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .row label {
    font-size: 13px;
    font-weight: 500;
    color: #444;
    min-width: 40px;
    flex-shrink: 0;
  }

  select {
    flex: 1;
    font-size: 13px;
    padding: 6px 8px;
    border: 1px solid #d0d0d8;
    border-radius: 6px;
    background: #fff;
    color: #222;
    cursor: pointer;
    outline: none;
    appearance: auto;
  }
  select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
  }

  .detected-badge {
    font-size: 11px;
    color: #6366f1;
    background: #ede9fe;
    border-radius: 4px;
    padding: 2px 6px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .result-box {
    margin-top: 14px;
    background: #f0f4ff;
    border: 1px solid #c7d2fe;
    border-radius: 8px;
    padding: 14px 16px;
  }

  .result-date {
    font-size: 14px;
    font-weight: 600;
    color: #1e1b4b;
    margin-bottom: 4px;
  }

  .result-time {
    font-size: 22px;
    font-weight: 700;
    color: #312e81;
    margin-bottom: 4px;
  }

  .result-tz {
    font-size: 12px;
    color: #6366f1;
  }

  .error-box {
    margin-top: 14px;
    background: #fff0f0;
    border: 1px solid #fca5a5;
    border-radius: 8px;
    padding: 14px 16px;
    color: #b91c1c;
    font-size: 14px;
    text-align: center;
  }

  .copy-btn {
    margin-top: 12px;
    width: 100%;
    padding: 9px;
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 7px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  .copy-btn:hover { background: #4f46e5; }
  .copy-btn:active { background: #4338ca; }
  .copy-btn.copied { background: #16a34a; }
`;

function buildTimezoneOptions(selectedTZ) {
  return ALL_TIMEZONES.map((tz) => {
    const opt = document.createElement("option");
    opt.value = tz;
    opt.textContent = tz.replace(/_/g, " ");
    if (tz === selectedTZ) opt.selected = true;
    return opt;
  });
}

function getLocalTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Show the timezone translation dialog.
 *
 * @param {object} opts
 * @param {string} opts.selectedText      - The raw selected text
 * @param {{ start: Date, end: Date|null, hasRange: boolean } | null} opts.parsed
 * @param {string | null} opts.detectedTZ - IANA tz detected from text, or null
 */
export function showDialog({ selectedText, parsed, detectedTZ }) {
  // Remove any existing dialog
  removeDialog();

  const host = document.createElement("div");
  host.id = "__tz-translator-host__";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });

  // Styles
  const style = document.createElement("style");
  style.textContent = STYLES;
  shadow.appendChild(style);

  // Backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  shadow.appendChild(backdrop);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) removeDialog();
  });

  // Dialog
  const dialog = document.createElement("div");
  dialog.className = "dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "Timezone Translator");
  backdrop.appendChild(dialog);

  // Header
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `<h2>Timezone Translator</h2>`;
  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", removeDialog);
  header.appendChild(closeBtn);
  dialog.appendChild(header);

  // Body
  const body = document.createElement("div");
  body.className = "body";
  dialog.appendChild(body);

  // Selected text
  const selectedEl = document.createElement("div");
  selectedEl.className = "selected-text";
  selectedEl.title = selectedText;
  selectedEl.innerHTML = `<strong>"</strong>${escapeHtml(selectedText)}<strong>"</strong>`;
  body.appendChild(selectedEl);

  // If no date parsed, show error state
  if (!parsed) {
    const errBox = document.createElement("div");
    errBox.className = "error-box";
    errBox.textContent = "No date or time found in the selected text.";
    body.appendChild(errBox);
    setupKeyClose();
    return;
  }

  // Parsed summary
  const parsedSummary = document.createElement("div");
  parsedSummary.className = "parsed-summary";
  parsedSummary.innerHTML = buildParsedSummary(parsed);
  body.appendChild(parsedSummary);

  const localTZ = getLocalTimezone();
  const fromTZ = detectedTZ || localTZ;
  const toTZ = localTZ;

  // From row
  const fromRow = document.createElement("div");
  fromRow.className = "row";

  const fromLabel = document.createElement("label");
  fromLabel.textContent = "From:";

  const fromSelect = document.createElement("select");
  fromSelect.setAttribute("aria-label", "Source timezone");
  buildTimezoneOptions(fromTZ).forEach((o) => fromSelect.appendChild(o));

  fromRow.appendChild(fromLabel);
  fromRow.appendChild(fromSelect);

  if (detectedTZ) {
    const badge = document.createElement("span");
    badge.className = "detected-badge";
    badge.textContent = "detected";
    fromRow.appendChild(badge);
  }

  body.appendChild(fromRow);

  // To row
  const toRow = document.createElement("div");
  toRow.className = "row";

  const toLabel = document.createElement("label");
  toLabel.textContent = "To:";

  const toSelect = document.createElement("select");
  toSelect.setAttribute("aria-label", "Target timezone");
  buildTimezoneOptions(toTZ).forEach((o) => toSelect.appendChild(o));

  toRow.appendChild(toLabel);
  toRow.appendChild(toSelect);
  body.appendChild(toRow);

  // Result box
  const resultBox = document.createElement("div");
  resultBox.className = "result-box";

  const resultDate = document.createElement("div");
  resultDate.className = "result-date";

  const resultTime = document.createElement("div");
  resultTime.className = "result-time";

  const resultTZ = document.createElement("div");
  resultTZ.className = "result-tz";

  resultBox.appendChild(resultDate);
  resultBox.appendChild(resultTime);
  resultBox.appendChild(resultTZ);
  body.appendChild(resultBox);

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-btn";
  copyBtn.textContent = "Copy to Clipboard";
  body.appendChild(copyBtn);

  // Live update function
  function updateResult() {
    const from = fromSelect.value;
    const to = toSelect.value;

    try {
      const conv = convertParsed(parsed, from, to);
      resultDate.textContent = conv.displayDate;
      resultTime.textContent = conv.displayTime;
      resultTZ.textContent = conv.displayTZ;

      copyBtn.dataset.copyText = `${conv.displayDate}\n${conv.displayTime} ${conv.displayTZ}`;
    } catch (e) {
      resultDate.textContent = "";
      resultTime.textContent = "Conversion error";
      resultTZ.textContent = e.message;
    }
  }

  fromSelect.addEventListener("change", updateResult);
  toSelect.addEventListener("change", updateResult);
  updateResult();

  // Copy button
  copyBtn.addEventListener("click", () => {
    const text = copyBtn.dataset.copyText || "";
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("copied");
      setTimeout(() => {
        copyBtn.textContent = "Copy to Clipboard";
        copyBtn.classList.remove("copied");
      }, 2000);
    });
  });

  setupKeyClose();

  // Focus close button for a11y
  closeBtn.focus();
}

function buildParsedSummary(parsed) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const startStr = fmt.format(parsed.start);
  if (parsed.hasRange && parsed.end) {
    const endStr = fmt.format(parsed.end);
    return `Parsed: <span>${startStr}</span> → <span>${endStr}</span>`;
  }
  return `Parsed: <span>${startStr}</span>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function removeDialog() {
  document.getElementById("__tz-translator-host__")?.remove();
  document.removeEventListener("keydown", onKeyDown);
}

function onKeyDown(e) {
  if (e.key === "Escape") removeDialog();
}

function setupKeyClose() {
  document.removeEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown);
}
