/* ===========================================================================
   Colour maths. No DOM, no state — everything here is a pure function so the
   generator can be reasoned about and tested on its own.
   =========================================================================== */

/* Deterministic PRNG. The feed has to be able to regenerate the exact same
   card from its seed — on a re-render, on a back navigation, on a reload —
   so nothing may depend on Math.random(). */
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const wrapHue = (h) => ((h % 360) + 360) % 360;

/* ---- conversions --------------------------------------------------------- */

export function hslToRgb(h, s, l) {
  h = wrapHue(h) / 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
}

export const hsl = (h, s, l) => rgbToHex(hslToRgb(h, s, l));

export function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16));
}

/* ---- contrast ------------------------------------------------------------
   WCAG relative luminance. Every generated palette is checked against this,
   so an infinite generator can never hand a client unreadable text. */

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* Walk a colour's lightness until it clears `target` contrast against `bg`.
   Direction is chosen by which side has more headroom, so it works for both
   light-on-dark and dark-on-light without the caller knowing which it has. */
export function ensureContrast(h, s, l, bg, target) {
  const up = luminance(bg) < 0.5;
  let out = hsl(h, s, l);
  for (let i = 0; i < 60 && contrast(out, bg) < target; i++) {
    l = clamp(l + (up ? 0.015 : -0.015), 0, 1);
    out = hsl(h, s, l);
    if (l === 0 || l === 1) break;
  }
  return out;
}

/* ---- small helpers used by the preview ----------------------------------- */

export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
}

export function alpha(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/* Readable foreground for a given background — used for text sitting on the
   accent, where the accent could be anything from yellow to navy. */
export function onColor(bg) {
  return contrast("#FFFFFF", bg) >= 4.5 ? "#FFFFFF" : "#101010";
}
