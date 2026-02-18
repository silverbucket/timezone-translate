/**
 * Generates all extension icons and Chrome Web Store promotional images.
 * Uses only @resvg/resvg-js (pure WASM, no native deps) to rasterize SVG → PNG.
 *
 *   node scripts/generate-assets.js
 *
 * Outputs:
 *   icons/icon16.png          16×16   extension toolbar icon
 *   icons/icon48.png          48×48   extension management page icon
 *   icons/icon128.png         128×128 Chrome Web Store icon (96×96 + 16px padding)
 *   store/small-promo.png     440×280 Chrome Web Store small promo tile
 *   store/marquee-promo.png  1400×560 Chrome Web Store marquee promo tile
 */

import { Resvg } from "@resvg/resvg-js";
import fs from "fs";

// ─── Design tokens ───────────────────────────────────────────────────────────
const INDIGO_DARK  = "#3730a3";
const INDIGO       = "#4f46e5";
const INDIGO_MID   = "#6366f1";
const INDIGO_LIGHT = "#818cf8";
const SLATE_DARK   = "#0f172a";
const SLATE        = "#1e293b";
const WHITE        = "#ffffff";
const WHITE_DIM    = "rgba(255,255,255,0.15)";
const WHITE_FAINT  = "rgba(255,255,255,0.07)";

// ─── SVG helpers ─────────────────────────────────────────────────────────────
function rasterize(svgStr, outputPath) {
  const resvg = new Resvg(svgStr, { fitTo: { mode: "original" } });
  fs.writeFileSync(outputPath, resvg.render().asPng());
  console.log(`  wrote ${outputPath}`);
}

// Clock hand endpoint given centre, length, and angle (0 = 12 o'clock, clockwise)
function hand(cx, cy, len, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + len * Math.cos(rad), y: cy + len * Math.sin(rad) };
}

// ─── ICON SVG ────────────────────────────────────────────────────────────────
// 128×128 canvas; actual artwork is a 96×96 circle centred at (64,64).
// The extra 16 px of transparent padding per side meets Chrome's spec.
function iconSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const pad = size / 8;          // 16px @ 128, scales to smaller sizes
  const r = size / 2 - pad;      // 48px @ 128

  // Clock hands: hour → 10:10 position (classic watch photo angle)
  const hour   = hand(cx, cy, r * 0.52, -60);   // 10 o'clock
  const minute = hand(cx, cy, r * 0.70,  60);   // 2 o'clock
  const center = r * 0.09;
  const tick   = r * 0.12;
  const tickR  = r * 0.85;

  // Four major tick marks (12, 3, 6, 9)
  function tickLine(angleDeg) {
    const outer = hand(cx, cy, tickR, angleDeg);
    const inner = hand(cx, cy, tickR - tick, angleDeg);
    return `<line x1="${outer.x}" y1="${outer.y}" x2="${inner.x}" y2="${inner.y}"
              stroke="${WHITE}" stroke-width="${r * 0.055}" stroke-linecap="round" opacity="0.9"/>`;
  }

  // Globe meridian ellipses (suggest world/timezone)
  const globeStroke = Math.max(0.8, r * 0.018);

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg${size}" cx="38%" cy="32%" r="75%">
      <stop offset="0%"   stop-color="${INDIGO_LIGHT}"/>
      <stop offset="100%" stop-color="${INDIGO_DARK}"/>
    </radialGradient>
    <!-- Subtle white glow so icon is visible on dark backgrounds -->
    <filter id="glow${size}" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${r * 0.07}" result="blur"/>
      <feFlood flood-color="${WHITE}" flood-opacity="0.28" result="fc"/>
      <feComposite in="fc" in2="blur" operator="in" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="clip${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}"/>
    </clipPath>
  </defs>

  <!-- Background circle with glow -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#bg${size})" filter="url(#glow${size})"/>

  <!-- Globe grid (clipped to circle) -->
  <g clip-path="url(#clip${size})" opacity="0.22">
    <!-- Equator + two latitude bands -->
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.28}" fill="none"
             stroke="${WHITE}" stroke-width="${globeStroke}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.60}" fill="none"
             stroke="${WHITE}" stroke-width="${globeStroke}"/>
    <!-- Two meridians -->
    <ellipse cx="${cx}" cy="${cy}" rx="${r * 0.42}" ry="${r}" fill="none"
             stroke="${WHITE}" stroke-width="${globeStroke}"/>
  </g>

  <!-- Subtle inner face ring -->
  <circle cx="${cx}" cy="${cy}" r="${r * 0.78}" fill="${WHITE_DIM}"/>

  <!-- Tick marks -->
  ${tickLine(0)} ${tickLine(90)} ${tickLine(180)} ${tickLine(270)}

  <!-- Hour hand -->
  <line x1="${cx}" y1="${cy}" x2="${hour.x}" y2="${hour.y}"
        stroke="${WHITE}" stroke-width="${r * 0.10}" stroke-linecap="round"/>

  <!-- Minute hand -->
  <line x1="${cx}" y1="${cy}" x2="${minute.x}" y2="${minute.y}"
        stroke="${WHITE}" stroke-width="${r * 0.065}" stroke-linecap="round"/>

  <!-- Centre cap -->
  <circle cx="${cx}" cy="${cy}" r="${center}" fill="${WHITE}"/>
</svg>`;
}

// ─── PROMO TILE SHARED ELEMENTS ───────────────────────────────────────────────
// Embeds a scaled version of the icon SVG inline (avoids external image refs)
function miniClock(cx, cy, r, id = "mc") {
  const h = hand(cx, cy, r * 0.52, -60);
  const m = hand(cx, cy, r * 0.70,  60);
  const tick = r * 0.12;
  const tickR = r * 0.85;
  function tl(a) {
    const o = hand(cx, cy, tickR, a);
    const i = hand(cx, cy, tickR - tick, a);
    return `<line x1="${o.x}" y1="${o.y}" x2="${i.x}" y2="${i.y}"
              stroke="${WHITE}" stroke-width="${r*0.055}" stroke-linecap="round" opacity="0.9"/>`;
  }
  return `
  <defs>
    <radialGradient id="bg${id}" cx="38%" cy="32%" r="75%">
      <stop offset="0%"   stop-color="${INDIGO_LIGHT}"/>
      <stop offset="100%" stop-color="${INDIGO_DARK}"/>
    </radialGradient>
    <filter id="sh${id}">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="${INDIGO}" flood-opacity="0.5"/>
    </filter>
    <clipPath id="cc${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#bg${id})" filter="url(#sh${id})"/>
  <g clip-path="url(#cc${id})" opacity="0.20">
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r*0.28}" fill="none" stroke="${WHITE}" stroke-width="1.5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r*0.60}" fill="none" stroke="${WHITE}" stroke-width="1.5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${r*0.42}" ry="${r}" fill="none" stroke="${WHITE}" stroke-width="1.5"/>
  </g>
  <circle cx="${cx}" cy="${cy}" r="${r*0.78}" fill="${WHITE_DIM}"/>
  ${tl(0)} ${tl(90)} ${tl(180)} ${tl(270)}
  <line x1="${cx}" y1="${cy}" x2="${h.x}" y2="${h.y}" stroke="${WHITE}" stroke-width="${r*0.10}" stroke-linecap="round"/>
  <line x1="${cx}" y1="${cy}" x2="${m.x}" y2="${m.y}" stroke="${WHITE}" stroke-width="${r*0.065}" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="${r*0.09}" fill="${WHITE}"/>`;
}

// Conversion chip: "6:00 PM ET  →  3:00 PM PT"
function conversionChip(x, y, w, h, from, to, fontSize, id = "chip") {
  const rx = h / 2;
  const arrowX = w / 2;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"
        fill="${WHITE_FAINT}" stroke="${INDIGO_LIGHT}" stroke-width="1.5"/>
  <text font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="${fontSize}" fill="${WHITE}" text-anchor="end"
        x="${x + arrowX - 14}" y="${y + h * 0.68}">${from}</text>
  <text font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="${fontSize * 1.1}" fill="${INDIGO_LIGHT}" text-anchor="middle"
        x="${x + arrowX}" y="${y + h * 0.72}">→</text>
  <text font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="${fontSize}" fill="${WHITE}" text-anchor="start"
        x="${x + arrowX + 14}" y="${y + h * 0.68}">${to}</text>`;
}

// ─── SMALL PROMO (440×280) ────────────────────────────────────────────────────
function smallPromoSvg() {
  const W = 440, H = 280;
  const iconR = 68;
  const iconCx = W - 90, iconCy = H / 2;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="spbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${SLATE_DARK}"/>
      <stop offset="100%" stop-color="#1a1040"/>
    </linearGradient>
    <!-- Subtle radial glow behind icon -->
    <radialGradient id="iglow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="${INDIGO}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${INDIGO}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#spbg)"/>

  <!-- Glow blob behind icon -->
  <ellipse cx="${iconCx}" cy="${iconCy}" rx="110" ry="110" fill="url(#igloo)"/>
  <radialGradient id="igloo" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="${INDIGO}" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="${INDIGO}" stop-opacity="0"/>
  </radialGradient>
  <ellipse cx="${iconCx}" cy="${iconCy}" rx="110" ry="110" fill="url(#igloo)"/>

  <!-- Icon -->
  ${miniClock(iconCx, iconCy, iconR, "sp")}

  <!-- Wordmark -->
  <text x="32" y="90"
        font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="34" font-weight="700" fill="${WHITE}" letter-spacing="-0.5">Timezone</text>
  <text x="32" y="132"
        font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="34" font-weight="700" fill="${INDIGO_LIGHT}" letter-spacing="-0.5">Translate</text>

  <!-- Tagline -->
  <text x="32" y="165"
        font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="14" fill="rgba(255,255,255,0.55)" letter-spacing="0.2">
    Highlight any time on the web. Convert instantly.
  </text>

  <!-- Conversion example chip -->
  ${conversionChip(32, 190, 280, 48, "6:00 PM ET", "3:00 PM PT", 15, "sp")}
</svg>`;
}

// ─── MARQUEE PROMO (1400×560) ─────────────────────────────────────────────────
function marqueePromoSvg() {
  const W = 1400, H = 560;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mpbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${SLATE_DARK}"/>
      <stop offset="60%"  stop-color="#16103a"/>
      <stop offset="100%" stop-color="#0d0820"/>
    </linearGradient>
    <radialGradient id="centerglow" cx="50%" cy="50%" r="55%">
      <stop offset="0%"   stop-color="${INDIGO}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${INDIGO}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#mpbg)"/>
  <ellipse cx="${W/2}" cy="${H/2}" rx="600" ry="340" fill="url(#centerglow)"/>

  <!-- Large icon: left side -->
  ${miniClock(220, H/2, 150, "mp")}

  <!-- Divider line -->
  <line x1="430" y1="120" x2="430" y2="${H-120}"
        stroke="${INDIGO_LIGHT}" stroke-width="1" opacity="0.18"/>

  <!-- Right: text content -->
  <!-- Label chip -->
  <rect x="480" y="140" width="220" height="34" rx="17"
        fill="${INDIGO}" fill-opacity="0.25"
        stroke="${INDIGO_LIGHT}" stroke-width="1" stroke-opacity="0.5"/>
  <text x="590" y="162"
        font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="13" font-weight="600" fill="${INDIGO_LIGHT}"
        text-anchor="middle" letter-spacing="1.5">BROWSER EXTENSION</text>

  <!-- Headline -->
  <text x="480" y="240"
        font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="72" font-weight="800" fill="${WHITE}" letter-spacing="-2">Timezone</text>
  <text x="480" y="322"
        font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="72" font-weight="800" fill="${INDIGO_LIGHT}" letter-spacing="-2">Translate</text>

  <!-- Tagline -->
  <text x="480" y="370"
        font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="22" fill="rgba(255,255,255,0.50)" letter-spacing="0.1">
    Highlight · Right-click · Done
  </text>

  <!-- Two conversion chips stacked -->
  ${conversionChip(480, 400, 480, 54, "6:00 PM ET", "3:00 PM PT", 17, "mp1")}
  ${conversionChip(480, 464, 480, 54, "Feb 19 | 9:00 AM – 1:00 PM EST", "6:00 AM – 10:00 AM PST", 13, "mp2")}
</svg>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log("Generating extension assets...");

rasterize(iconSvg(128), "icons/icon128.png");
rasterize(iconSvg(48),  "icons/icon48.png");
rasterize(iconSvg(16),  "icons/icon16.png");

rasterize(smallPromoSvg(),   "store/small-promo.png");
rasterize(marqueePromoSvg(), "store/marquee-promo.png");

console.log("Done.");
