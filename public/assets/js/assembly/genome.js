/* ===========================================================================
   The option space.

   Every section of the survey — palette, type, shape, components — is a set of
   numeric "genes". That buys three things at once:

     • infinite options      a genome is sampled, not looked up in a list
     • "suggest like this"   sample near a genome instead of anywhere
     • a stable feed         genome comes from a seed, so card #4,181 is the
                             same card every time it is drawn

   Nothing here renders. render.js turns a genome into something you can look
   at; this file only decides what the thing is.
   =========================================================================== */

import { mulberry32, clamp, hsl, ensureContrast, contrast, mix, onColor } from "./color.js";

/* ---- generic genome machinery -------------------------------------------- */

const lerp = (a, b, t) => a + (b - a) * t;

/* Shortest distance between two hues, 0..1, so 350° and 10° read as close. */
function circDist(a, b, span) {
  const d = Math.abs(a - b) % span;
  return (d > span / 2 ? span - d : d) / (span / 2);
}

export function sample(spec, rng) {
  const g = {};
  for (const [k, f] of Object.entries(spec)) {
    g[k] = f.discrete
      ? f.values[Math.floor(rng() * f.values.length)]
      : lerp(f.range[0], f.range[1], rng());
  }
  return g;
}

/* Sample near `target`. `spread` is 0..1: 0 is "give me that exact thing
   again", 1 is "anywhere". Each gene gets its own window around the target,
   so the family stays recognisable while still varying. */
export function sampleNear(spec, rng, target, spread) {
  const g = {};
  for (const [k, f] of Object.entries(spec)) {
    if (f.discrete) {
      // mostly hold the target's value, occasionally step to a neighbour
      g[k] = rng() < 1 - spread * 0.75
        ? target[k]
        : f.values[Math.floor(rng() * f.values.length)];
      continue;
    }
    const [lo, hi] = f.range;
    const window = (hi - lo) * spread * (f.spread || 1);
    let v = target[k] + (rng() * 2 - 1) * window;
    if (f.circular) { const span = hi - lo; v = ((v - lo) % span + span) % span + lo; }
    else v = clamp(v, lo, hi);
    g[k] = v;
  }
  return g;
}

/* 0 (identical) .. 1 (opposite). Used to rank how well a card matches what the
   client said they liked. */
export function distance(spec, a, b) {
  let sum = 0, total = 0;
  for (const [k, f] of Object.entries(spec)) {
    const w = f.weight || 1;
    total += w;
    if (f.discrete) { sum += (a[k] === b[k] ? 0 : 1) * w; continue; }
    const [lo, hi] = f.range;
    sum += (f.circular ? circDist(a[k], b[k], hi - lo)
                       : Math.abs(a[k] - b[k]) / (hi - lo)) * w;
  }
  return total ? sum / total : 0;
}

/* =========================================================================
   1. PALETTE
   ========================================================================= */

// how far the supporting hues sit from the base hue, per harmony
const HARMONY = {
  0: { name: "Monochrome",         offsets: [0, 0] },
  1: { name: "Analogous",          offsets: [28, -28] },
  2: { name: "Complementary",      offsets: [180, 8] },
  3: { name: "Split complementary",offsets: [150, -150] },
  4: { name: "Triadic",            offsets: [120, -120] },
  5: { name: "Tetradic",           offsets: [90, 180] },
};

export const PALETTE_SPEC = {
  hue:       { range: [0, 360], circular: true, weight: 1.5, spread: 0.35 },
  harmony:   { discrete: true, values: [0, 1, 2, 3, 4, 5], weight: 1.2 },
  dark:      { discrete: true, values: [0, 1], weight: 1.6 },
  chroma:    { range: [0.05, 0.95], weight: 1.2 },
  neutralTint:{ range: [0, 0.22], weight: 0.6 },
  depth:     { range: [0.02, 0.16], weight: 0.5 },   // ground -> surface step
  accentPop: { range: [0.35, 0.72], weight: 1.0 },   // accent lightness
  accentSat: { range: [0.35, 1.0], weight: 1.1 },
  warmth:    { range: [-18, 18], weight: 0.7 },      // hue drift on neutrals
};

/* A genome becomes six roles. Text and muted are pushed until they clear a
   contrast ratio, so no sampled palette can be illegible — the generator is
   allowed to be wild about hue, never about readability. */
export function buildPalette(g) {
  const dark = g.dark === 1;
  const h = g.hue;
  const nh = h + g.warmth;                       // neutrals drift, not match
  const ns = g.neutralTint;                      // how much hue the greys carry

  const groundL  = dark ? lerp(0.04, 0.12, g.depth / 0.16) : lerp(0.93, 0.995, 1 - g.depth / 0.16);
  const surfaceL = dark ? groundL + g.depth * 0.9 : groundL - g.depth * 0.35;

  const ground  = hsl(nh, ns, groundL);
  const surface = hsl(nh, ns * 0.9, clamp(surfaceL, 0, 1));

  const text  = ensureContrast(nh, ns * 0.5, dark ? 0.95 : 0.12, ground, 10);
  const muted = ensureContrast(nh, ns * 0.8, dark ? 0.62 : 0.44, ground, 4.5);

  const [o1, o2] = HARMONY[g.harmony].offsets;
  const accent  = ensureContrast(h + o1, g.accentSat, g.accentPop, ground, 3.2);
  const accent2 = ensureContrast(h + o2, g.accentSat * 0.82, clamp(g.accentPop + (dark ? -0.08 : 0.08), 0.2, 0.85), ground, 3.2);

  return {
    dark, ground, surface, text, muted, accent, accent2,
    line: mix(ground, text, dark ? 0.14 : 0.12),
    onAccent: onColor(accent),
    harmonyName: HARMONY[g.harmony].name,
    contrastText: contrast(text, ground),
  };
}

/* =========================================================================
   2. TYPE
   Fonts carry coordinates so "suggest like this" moves through families that
   actually feel related, rather than jumping to a random other font.
   ========================================================================= */

/* The site's CSP is `font-src 'self'` and it deliberately loads no third-party
   resources, so these are the two faces the site already self-hosts plus
   stacks that resolve on the visitor's own machine. Nothing is fetched.
   Adding more means self-hosting the woff2 — see assembly.html.
   Columns: name, stack, serif, geometry, quirk, weightFeel. */
export const FONTS = [
  // self-hosted by the site
  ["Instrument Sans",  "'Instrument Sans',system-ui,sans-serif",                 0, .70, .25, .55],
  ["Newsreader",       "'Newsreader',Georgia,serif",                             1, .30, .35, .45],
  // resolve locally on effectively every machine
  ["System UI",        "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",   0, .60, .08, .50],
  ["Helvetica",        "Helvetica,'Helvetica Neue',Arial,sans-serif",            0, .58, .10, .50],
  ["Arial",            "Arial,Helvetica,sans-serif",                             0, .55, .12, .50],
  ["Verdana",          "Verdana,Geneva,sans-serif",                              0, .48, .30, .58],
  ["Tahoma",           "Tahoma,Verdana,sans-serif",                              0, .52, .26, .55],
  ["Trebuchet MS",     "'Trebuchet MS',Tahoma,sans-serif",                       0, .50, .45, .55],
  ["Arial Black",      "'Arial Black',Impact,sans-serif",                        0, .58, .80, .95],
  ["Impact",           "Impact,'Arial Black',sans-serif",                        0, .70, .88, .95],
  ["Georgia",          "Georgia,'Times New Roman',serif",                        1, .34, .32, .52],
  ["Times New Roman",  "'Times New Roman',Times,serif",                          1, .26, .22, .48],
  ["Palatino",         "'Palatino Linotype','Book Antiqua',Palatino,serif",      1, .24, .48, .48],
  ["Garamond",         "Garamond,'Times New Roman',serif",                       1, .20, .55, .42],
  ["Courier New",      "'Courier New',Courier,monospace",                        1, .45, .62, .45],
  ["Monospace",        "ui-monospace,Menlo,Consolas,'Courier New',monospace",    0, .52, .58, .50],
];

export const TYPE_SPEC = {
  display:  { discrete: true, values: FONTS.map((_, i) => i), weight: 1.8 },
  body:     { discrete: true, values: FONTS.map((_, i) => i), weight: 1.4 },
  scale:    { range: [1.18, 1.55], weight: 0.8 },   // modular scale ratio
  tracking: { range: [-0.03, 0.12], weight: 0.7 },  // display letter-spacing, em
  dWeight:  { discrete: true, values: [400, 500, 600, 700, 800], weight: 0.9 },
  caseMode: { discrete: true, values: [0, 1], weight: 0.6 },   // 1 = display in caps
};

/* A pairing only reads as designed when the two faces differ. Nudge the body
   face away from the display face rather than rejecting the sample, so the
   feed never stalls looking for an acceptable draw. */
export function buildType(g) {
  let d = g.display, b = g.body;
  const near = (i, j) => Math.abs(FONTS[i][2] - FONTS[j][2]) < 0.5
                      && Math.abs(FONTS[i][4] - FONTS[j][4]) < 0.35;
  if (d === b || near(d, b)) {
    // prefer a serif body under a sans display, and the reverse
    const wantSerif = FONTS[d][2] === 0 ? 1 : 0;
    const pool = FONTS.map((f, i) => i).filter(i => FONTS[i][2] === wantSerif);
    b = pool[(d * 7 + 3) % pool.length];
  }
  return {
    displayName: FONTS[d][0], displayStack: FONTS[d][1],
    bodyName: FONTS[b][0],    bodyStack: FONTS[b][1],
    scale: g.scale, tracking: g.tracking, weight: g.dWeight,
    caps: g.caseMode === 1,
  };
}

/* =========================================================================
   3. SHAPE — the feel of the furniture: corners, density, motion, borders
   ========================================================================= */

export const SHAPE_SPEC = {
  radius:   { range: [0, 28], weight: 1.6 },
  border:   { range: [0, 3], weight: 1.0 },
  density:  { range: [0.78, 1.45], weight: 1.2 },   // padding multiplier
  shadow:   { range: [0, 1], weight: 0.9 },
  motion:   { range: [0, 1], weight: 0.7 },
  elevation:{ discrete: true, values: [0, 1], weight: 0.8 },  // flat vs lifted
};

export function buildShape(g) {
  const r = Math.round(g.radius);
  return {
    radius: r,
    border: Math.round(g.border),
    density: g.density,
    shadowCss: g.elevation === 0 || g.shadow < 0.18
      ? "none"
      : `0 ${(6 + g.shadow * 26).toFixed(0)}px ${(18 + g.shadow * 44).toFixed(0)}px rgba(0,0,0,${(0.06 + g.shadow * 0.22).toFixed(3)})`,
    ms: Math.round(80 + g.motion * 620),
    name: r < 3 ? "Hard edged" : r < 9 ? "Lightly rounded" : r < 18 ? "Rounded" : "Pill soft",
  };
}

/* =========================================================================
   4. COMPONENTS — a catalogue, not a generator. Clients pick several.
   Coordinates again, so "suggest like this" works here too.
   ========================================================================= */

export const COMPONENTS = [
  { id:"hero-split",   name:"Split hero",            group:"Hero",      note:"Headline one side, image the other", x:[.2,.3] },
  { id:"hero-center",  name:"Centred hero",          group:"Hero",      note:"Big statement, one call to action",  x:[.1,.2] },
  { id:"hero-video",   name:"Video background hero", group:"Hero",      note:"Looping footage behind the headline",x:[.8,.4] },
  { id:"hero-canvas",  name:"Animated canvas hero",  group:"Hero",      note:"Generative motion behind the type",  x:[.9,.5] },

  { id:"carousel",     name:"Image carousel",        group:"Media",     note:"Swipeable set of images with dots",  x:[.6,.6] },
  { id:"news-band",    name:"Sliding news banner",   group:"Media",     note:"Auto-advancing headline band — the one on the ABA memo", x:[.65,.7] },
  { id:"ticker",       name:"Scrolling ticker",      group:"Media",     note:"Continuous marquee strip",           x:[.7,.8] },
  { id:"gallery-grid", name:"Photo grid",            group:"Media",     note:"Masonry or even grid of images",     x:[.5,.4] },
  { id:"lightbox",     name:"Click to enlarge",      group:"Media",     note:"Full-screen image viewer",           x:[.45,.5] },
  { id:"before-after", name:"Before / after slider", group:"Media",     note:"Drag a handle to compare two images",x:[.72,.62] },

  { id:"cards",        name:"Feature cards",         group:"Content",   note:"Three or four repeating blocks",     x:[.3,.25] },
  { id:"accordion",    name:"Accordion / FAQ",       group:"Content",   note:"Questions that open one at a time",  x:[.25,.35] },
  { id:"tabs",         name:"Tabbed sections",       group:"Content",   note:"Switch panels without leaving",      x:[.35,.3] },
  { id:"timeline",     name:"Timeline",              group:"Content",   note:"Dated steps down the page",          x:[.4,.45] },
  { id:"stats",        name:"Stat counters",         group:"Content",   note:"Numbers that count up on scroll",    x:[.55,.55] },
  { id:"testimonial",  name:"Testimonial slider",    group:"Content",   note:"Quotes that rotate",                 x:[.6,.5] },
  { id:"logo-wall",    name:"Logo wall",             group:"Content",   note:"Row of partner or client marks",     x:[.3,.5] },
  { id:"pricing",      name:"Pricing table",         group:"Content",   note:"Columns compared side by side",      x:[.35,.2] },

  { id:"contact",      name:"Contact form",          group:"Action",    note:"Name, email, message, send",         x:[.15,.15] },
  { id:"booking",      name:"Booking / calendar",    group:"Action",    note:"Pick a slot and confirm",            x:[.4,.1] },
  { id:"newsletter",   name:"Newsletter sign-up",    group:"Action",    note:"One field and a button",             x:[.2,.1] },
  { id:"search",       name:"Site search",           group:"Action",    note:"Search across the whole site",       x:[.35,.15] },
  { id:"filter",       name:"Filter and sort",       group:"Action",    note:"Narrow a long list down",            x:[.45,.2] },
  { id:"login",        name:"Accounts / sign in",    group:"Action",    note:"Members see different content",      x:[.5,.1] },

  { id:"map",          name:"Embedded map",          group:"Extras",    note:"Pin on a real map",                  x:[.5,.3] },
  { id:"chat",         name:"Live chat bubble",      group:"Extras",    note:"Corner chat launcher",               x:[.6,.25] },
  { id:"cookie",       name:"Cookie notice",         group:"Extras",    note:"Consent bar on first visit",         x:[.2,.05] },
  { id:"darkmode",     name:"Dark mode switch",      group:"Extras",    note:"Reader picks light or dark",         x:[.55,.45] },
  { id:"multilang",    name:"Language switcher",     group:"Extras",    note:"Two or more languages",              x:[.4,.25] },
  { id:"blog",         name:"Blog / news index",     group:"Extras",    note:"Posts with their own pages",         x:[.3,.4] },
];

export function componentDistance(a, b) {
  const dx = a.x[0] - b.x[0], dy = a.x[1] - b.x[1];
  return Math.sqrt(dx * dx + dy * dy) / Math.SQRT2;
}

/* ---- the feed's own sampler ---------------------------------------------
   `index` is the card's position in the feed. Same index, same card. When the
   client has said "more like this", the sampler tightens around that genome
   and loosens again the further down they scroll, so a steer narrows the feed
   without ever trapping them in it. */
export function genomeAt(spec, seed, index, steer) {
  const rng = mulberry32(seed * 1_000_003 + index * 7919);
  if (!steer) return sample(spec, rng);
  const spread = clamp(0.10 + index * 0.006, 0.10, 0.55);
  return sampleNear(spec, rng, steer, spread);
}
