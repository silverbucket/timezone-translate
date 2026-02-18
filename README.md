# Timezone Translate

A Chrome and Firefox browser extension that lets you highlight any natural-language date/time text on a webpage, right-click → **Timezone Translate**, and instantly see the time converted to your local timezone.

## Features

- **Natural language parsing** — understands virtually any date/time format: `Feb 19th | 6:00 PM ET`, `9am-5pm PST`, `Thursday at noon`, `14:00 UTC`, and more
- **Auto-detects timezone** — recognizes abbreviations (`EST`, `ET`, `PST`, `PT`, `GMT`, `CET`, etc.) and plain English names (`Eastern`, `Pacific`, `Central`) in the selected text
- **Range support** — converts both endpoints of a time range (e.g. `9:00 AM – 1:00 PM`)
- **Live dropdowns** — change the source or target timezone and the result updates instantly
- **Copy to clipboard** — one click copies the converted time
- **Shadow DOM isolation** — the dialog doesn't interfere with host-page styles
- **Chrome + Firefox** — works as an MV3 extension in Chrome/Edge and via `about:debugging` in Firefox

## Installation

### From source

```bash
git clone git@github.com:silverbucket/timezone-translate.git
cd timezone-translate
npm install
npm run build
```

Then load the `dist/` folder as an unpacked extension:

- **Chrome/Edge:** `chrome://extensions` → enable *Developer mode* → *Load unpacked* → select `dist/`
- **Firefox:** `about:debugging` → *This Firefox* → *Load Temporary Add-on* → select `dist/manifest.json`

### Development (auto-rebuild on file change)

```bash
npm run watch
```

## Usage

1. Select any text containing a date/time on any webpage
2. Right-click → **Timezone Translate**
3. The dialog shows the converted time
   - **From** is pre-filled if a timezone was detected in the text
   - **To** defaults to your system's local timezone
4. Adjust either dropdown to update the result live
5. Click **Copy to Clipboard** to copy the result

## Supported timezone formats

| Format | Examples |
|--------|---------|
| US abbreviations | `EST`, `EDT`, `ET`, `CST`, `CDT`, `CT`, `MST`, `MDT`, `MT`, `PST`, `PDT`, `PT` |
| US full names | `Eastern`, `Eastern Time`, `Central Standard Time`, `Pacific Daylight Time` |
| International | `UTC`, `GMT`, `CET`, `CEST`, `BST`, `IST`, `JST`, `KST`, `AEST`, `NZST`, … |
| Other regions | `Alaska`, `Hawaii`, `Atlantic`, `Brazil`, `Argentina`, `New Zealand`, … |

