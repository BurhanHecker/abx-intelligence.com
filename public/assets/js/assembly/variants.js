/* ===========================================================================
   Menus, buttons and heroes as genomes rather than lists.

   A hand-written catalogue of fourteen menus is not "keep scrolling until it
   is right" — it is a dropdown with extra steps. These describe the axes a
   menu actually varies along (where it sits, how it is filled, what it does
   under the cursor, its radius, weight, case, spacing) and let the sampler
   combine them, which is the same trick the colour engine uses.

   Everything renders inside a real page so the preview fills the stage.
   =========================================================================== */

import { alpha, mix } from "./color.js";
import { PAGE_W } from "./sites.js";

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
let uid = 0; const nextId = () => "v" + (++uid);
const LINKS = ["Home", "About", "Services", "Contact"];

/* ---------------------------------------------------------------- MENUS -- */

export const MENU_POSITIONS = [
  { id:"left",   name:"Left",            note:"Logo left, links beside it" },
  { id:"right",  name:"Right",           note:"Logo left, links pushed right" },
  { id:"centre", name:"Centre",          note:"Everything centred" },
  { id:"split",  name:"Split",           note:"Logo in the middle, links either side" },
  { id:"rail",   name:"Side rail",       note:"Vertical, down the left edge" },
];

const MENU_FILL  = ["Transparent","Solid bar","Frosted glass","Floating island","Outlined"];
const MENU_HOVER = ["Underline","Filled pill","Accent text","Outlined box","Lift",
                    "Whole bar inverts","Background fades in","Dot marker",
                    "Letters spread","Strikethrough"];

export const MENU_SPEC = {
  fill:    { discrete:true, values:[0,1,2,3,4], weight:1.5 },
  hover:   { discrete:true, values:[0,1,2,3,4,5,6,7,8,9], weight:1.6 },
  radius:  { range:[0,26], weight:.9 },
  caseMode:{ discrete:true, values:[0,1], weight:.8 },
  weight:  { discrete:true, values:[400,500,600,700,800], weight:.7 },
  tracking:{ range:[-0.01,0.16], weight:.7 },
  gap:     { range:[12,42], weight:.6 },
  size:    { range:[12,17], weight:.5 },
  cta:     { discrete:true, values:[0,1,2], weight:.9 },
  rule:    { discrete:true, values:[0,1,2], weight:.6 },
};

export function menuName(g) {
  return `${MENU_FILL[g.fill]} · ${MENU_HOVER[g.hover]}`;
}

/* The style name alone repeats every fifty options, which makes a feed of
   genuinely different menus read as a loop. These spell out the axes that
   actually differ between two menus sharing a name. */
export function menuDetail(g) {
  const bits = [`${g.size.toFixed(0)}px`];
  if (g.caseMode) bits.push("caps");
  if (g.tracking > .06) bits.push("tracked");
  if (g.weight >= 700) bits.push("bold");
  else if (g.weight <= 400) bits.push("light");
  bits.push(g.gap > 32 ? "wide spacing" : g.gap < 20 ? "tight" : "even spacing");
  bits.push(g.cta === 1 ? "solid button" : g.cta === 2 ? "outlined button" : "no button");
  if (g.rule === 2) bits.push("heavy rule");
  else if (g.rule === 0) bits.push("no rule");
  if (g.radius >= 18) bits.push("pill links");
  else if (g.radius <= 3) bits.push("square links");
  return bits.join(", ");
}

export function renderMenuVariant(g, pos, p, t, s) {
  const k = nextId();
  const r = Math.round(g.radius);
  const ms = s.ms || 240;
  const E = "cubic-bezier(.22,1,.36,1)";
  const onBar = p.text;

  const fillCss = [
    ``,                                                                    // transparent
    `background:${p.surface};`,                                            // solid
    `background:${alpha(p.surface,.6)};backdrop-filter:blur(16px) saturate(1.5);
     border:1px solid ${alpha(p.text,.11)};`,                              // glass
    `background:${p.surface};border:1px solid ${p.line};border-radius:999px;
     box-shadow:0 14px 40px ${alpha("#000",.32)};margin:18px 42px;`,       // floating
    `border:${Math.max(1,s.border)}px solid ${p.line};border-radius:${r}px;margin:14px 42px;`,
  ][g.fill];

  const ruleCss = g.rule === 0 ? "" :
    `border-bottom:${g.rule === 1 ? Math.max(1,s.border) : 3}px solid ${g.rule === 1 ? p.line : p.text};`;

  const hoverCss = [
    `.${k} a::after{content:"";position:absolute;left:10px;right:10px;bottom:3px;height:2px;
       background:${p.accent};transform:scaleX(0);transform-origin:left;transition:transform ${ms}ms ${E}}
     .${k} a:hover{color:${onBar}} .${k} a:hover::after{transform:scaleX(1)}`,
    `.${k} a:hover{background:${p.accent};color:${p.onAccent}}`,
    `.${k} a:hover{color:${p.accent}}`,
    `.${k} a{border:1px solid transparent} .${k} a:hover{border-color:${p.accent};color:${onBar}}`,
    `.${k} a:hover{transform:translateY(-2px);color:${p.accent}}`,
    `.${k} .bar:hover{background:${p.accent}} .${k} .bar:hover .logo{color:${p.onAccent}}
     .${k} .bar:hover a{color:${alpha(p.onAccent,.82)}} .${k} .bar:hover a:hover{color:${p.onAccent}}`,
    `.${k} a:hover{background:${alpha(p.text,.10)};color:${onBar}}`,
    `.${k} a::before{content:"";position:absolute;left:50%;top:2px;width:4px;height:4px;
       border-radius:50%;background:${p.accent};opacity:0;transform:translateX(-50%) scale(.4);
       transition:all ${ms}ms ${E}}
     .${k} a:hover::before{opacity:1;transform:translateX(-50%) scale(1)}
     .${k} a:hover{color:${onBar}}`,
    `.${k} a:hover{letter-spacing:.18em;color:${p.accent}}`,
    `.${k} a:hover{color:${p.muted};text-decoration:line-through;text-decoration-color:${p.accent}}`,
  ][g.hover];

  const vertical = pos.id === "rail";
  const css = `
    .${k}{font-family:${t.displayStack}}
    .${k} .bar{display:flex;align-items:center;gap:${Math.round(g.gap)}px;
      padding:${vertical ? "24px 20px" : "18px 42px"};${fillCss}${ruleCss}
      transition:background ${ms}ms ${E};${vertical ? "flex-direction:column;align-items:flex-start;height:100%;width:210px;" : ""}}
    .${k} .logo{font-weight:${t.weight};letter-spacing:${t.tracking}em;font-size:${(g.size*1.3).toFixed(1)}px;color:${onBar}}
    .${k} .links{display:flex;align-items:center;gap:6px;${vertical ? "flex-direction:column;align-items:stretch;width:100%;margin-top:14px;" : ""}}
    .${k} a{position:relative;color:${p.muted};text-decoration:none;cursor:pointer;
      font-size:${g.size.toFixed(1)}px;font-weight:${g.weight};letter-spacing:${g.tracking.toFixed(3)}em;
      ${g.caseMode ? "text-transform:uppercase;" : ""}
      padding:9px ${Math.max(8, Math.round(g.gap * .35))}px;border-radius:${Math.min(r,14)}px;
      transition:all ${ms}ms ${E}}
    ${hoverCss}
    .${k} .cta{background:${g.cta === 1 ? p.accent : "transparent"};
      color:${g.cta === 1 ? p.onAccent : p.accent};
      ${g.cta === 2 ? `box-shadow:inset 0 0 0 1px ${p.accent};` : ""}
      font-weight:700;padding:9px 17px;border-radius:${Math.min(r,16)}px}
    .${k} .cta:hover{background:${g.cta === 1 ? mix(p.accent,"#000",.2) : alpha(p.accent,.14)};
      color:${g.cta === 1 ? p.onAccent : p.accent}}
  `;

  const links = LINKS.map(l => `<a>${l}</a>`).join("");
  const ctaEl = g.cta ? `<a class="cta">Get in touch</a>` : "";
  let bar;
  if (pos.id === "left")
    bar = `<span class="logo">Studio</span><span class="links">${links}</span>${ctaEl}`;
  else if (pos.id === "right")
    bar = `<span class="logo">Studio</span><span class="links" style="margin-left:auto">${links}</span>${ctaEl}`;
  else if (pos.id === "centre")
    bar = `<span style="flex:1"></span><span class="logo">Studio</span>
           <span class="links">${links}</span>${ctaEl}<span style="flex:1"></span>`;
  else if (pos.id === "split")
    bar = `<span class="links" style="flex:1">${LINKS.slice(0,2).map(l=>`<a>${l}</a>`).join("")}</span>
           <span class="logo">Studio</span>
           <span class="links" style="flex:1;justify-content:flex-end">
           ${LINKS.slice(2).map(l=>`<a>${l}</a>`).join("")}</span>`;
  else
    bar = `<span class="logo">Studio</span><span class="links">${links}</span>${ctaEl}`;

  /* the page underneath, so the bar is seen in the place it will live */
  const body = `
    <div style="padding:${vertical ? "56px 52px" : "62px 52px 70px"};flex:1">
      <div style="font-family:${t.displayStack};font-weight:${t.weight};font-size:46px;
        letter-spacing:${t.tracking}em;color:${p.text};line-height:1.06;max-width:70%">
        Build something worth visiting</div>
      <p style="font-family:${t.bodyStack};color:${p.muted};font-size:17px;margin:18px 0 0;max-width:50%">
        Hover the navigation above — every option behaves differently.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px">
        ${[0,1,2].map(i=>`<div style="height:96px;border-radius:${Math.min(s.radius,14)}px;
          background:${alpha(p.text,.06)};border:${s.border}px solid ${p.line}"></div>`).join("")}</div>
    </div>`;

  const html = vertical
    ? `<div class="${k}" style="display:flex;background:${p.ground};min-height:520px">
         <div class="bar">${bar}</div>${body}</div>`
    : `<div class="${k}" style="background:${p.ground};min-height:520px;display:flex;flex-direction:column">
         <div class="bar">${bar}</div>${body}</div>`;

  return { css, html: `<div class="pagefit"><div class="pagescale" style="width:${PAGE_W}px">${html}</div></div>` };
}

/* -------------------------------------------------------------- BUTTONS -- */

const BTN_FILL  = ["Solid","Outlined","Ghost","Two-tone","Text only","Offset block"];
const BTN_HOVER = ["Darkens","Fills in","Lifts","Presses down","Arrow slides",
                   "Glows","Rule sweeps","Inverts","Widens"];
const BTN_SHAPE = ["Square","Rounded","Pill"];

export const BUTTON_SPEC = {
  shape: { discrete:true, values:[0,1,2], weight:1.4 },
  fill:  { discrete:true, values:[0,1,2,3,4,5], weight:1.6 },
  hover: { discrete:true, values:[0,1,2,3,4,5,6,7,8], weight:1.5 },
  size:  { range:[13,18], weight:.8 },
  padX:  { range:[18,40], weight:.7 },
  padY:  { range:[10,20], weight:.7 },
  weight:{ discrete:true, values:[500,600,700,800], weight:.7 },
  caseMode:{ discrete:true, values:[0,1], weight:.8 },
  tracking:{ range:[-0.01,0.14], weight:.6 },
  icon:  { discrete:true, values:[0,1,2], weight:.9 },
};

export const buttonName = (g) =>
  `${BTN_FILL[g.fill]} · ${BTN_SHAPE[g.shape]} · ${BTN_HOVER[g.hover]}`;

export function buttonDetail(g) {
  const bits = [`${g.size.toFixed(0)}px`];
  if (g.caseMode) bits.push("caps");
  if (g.tracking > .06) bits.push("tracked");
  bits.push(g.weight >= 700 ? "bold" : "medium");
  bits.push(g.padX > 32 ? "roomy" : g.padX < 23 ? "compact" : "standard padding");
  if (g.icon === 1) bits.push("with arrow");
  else if (g.icon === 2) bits.push("with dot");
  return bits.join(", ");
}

export function renderButtonVariant(g, p, t, s) {
  const k = nextId();
  const r = [0, Math.max(4, Math.min(s.radius, 14)), 999][g.shape];
  const ms = s.ms || 240;
  const E = "cubic-bezier(.22,1,.36,1)";

  const fill = [
    `background:${p.accent};color:${p.onAccent};`,
    `background:transparent;color:${p.accent};box-shadow:inset 0 0 0 ${Math.max(1,s.border)}px ${p.accent};`,
    `background:${alpha(p.text,.07)};color:${p.text};`,
    `background:linear-gradient(110deg,${p.accent},${p.accent2});background-size:180% 100%;color:${p.onAccent};`,
    `background:none;color:${p.text};padding-left:2px;padding-right:2px;`,
    `background:${p.accent};color:${p.onAccent};box-shadow:5px 5px 0 ${p.text};`,
  ][g.fill];

  const hover = [
    `.${k} .b:hover{filter:brightness(.86)}`,
    `.${k} .b:hover{background:${p.accent};color:${p.onAccent};box-shadow:none}`,
    `.${k} .b:hover{transform:translateY(-3px);box-shadow:0 14px 30px ${alpha("#000",.4)}}`,
    `.${k} .b:hover{transform:translate(5px,5px);box-shadow:0 0 0 ${p.text}}`,
    `.${k} .b i{transition:transform ${ms}ms ${E}} .${k} .b:hover i{transform:translateX(6px)}`,
    `.${k} .b:hover{box-shadow:0 0 30px ${alpha(p.accent,.8)}}`,
    `.${k} .b::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:${p.accent};
       transform:scaleX(0);transform-origin:left;transition:transform ${ms}ms ${E}}
     .${k} .b:hover::after{transform:scaleX(1)}`,
    `.${k} .b:hover{background:${p.text};color:${p.ground};box-shadow:none}`,
    `.${k} .b:hover{padding-left:${(g.padX*1.35).toFixed(0)}px;padding-right:${(g.padX*1.35).toFixed(0)}px}`,
  ][g.hover];

  const css = `
    .${k}{font-family:${t.displayStack}}
    .${k} .b{position:relative;display:inline-flex;align-items:center;gap:10px;cursor:pointer;
      border:0;border-radius:${r}px;font-family:inherit;text-decoration:none;
      font-size:${g.size.toFixed(1)}px;font-weight:${g.weight};
      letter-spacing:${g.tracking.toFixed(3)}em;${g.caseMode ? "text-transform:uppercase;" : ""}
      padding:${g.padY.toFixed(0)}px ${g.padX.toFixed(0)}px;${fill}
      transition:all ${ms}ms ${E}}
    ${hover}
    .${k} .g{background:transparent;color:${p.muted};box-shadow:inset 0 0 0 1px ${p.line};filter:none}
    .${k} .g:hover{color:${p.text}}
  `;

  const ic = ["", `<i style="font-style:normal">&#8594;</i>`,
              `<i style="font-style:normal;width:7px;height:7px;border-radius:50%;
                 background:currentColor;display:inline-block"></i>`][g.icon];

  const html = `
    <div class="${k}" style="background:${p.ground};min-height:520px;display:flex;
      flex-direction:column;justify-content:center;padding:0 52px">
      <div style="font-family:${t.displayStack};font-weight:${t.weight};font-size:42px;
        letter-spacing:${t.tracking}em;color:${p.text};line-height:1.06;max-width:66%">
        Ready when you are.</div>
      <p style="font-family:${t.bodyStack};color:${p.muted};font-size:17px;margin:18px 0 34px;max-width:48%">
        Hover either button to see how this style behaves.</p>
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <a class="b">Get started${ic}</a>
        <a class="b g">Learn more</a>
      </div>
      <div style="margin-top:52px;padding-top:28px;border-top:${s.border}px solid ${p.line};
        display:flex;gap:14px;align-items:center;font-family:${t.bodyStack};
        color:${p.muted};font-size:15px">
        Also used for smaller actions <a class="b" style="transform:scale(.82);transform-origin:left">Save</a>
      </div>
    </div>`;

  return { css, html: `<div class="pagefit"><div class="pagescale" style="width:${PAGE_W}px">${html}</div></div>` };
}

/* ---------------------------------------------------------------- HEROES -- */

const HERO_SHAPE = ["Centred","Ranged left","Split","Image behind","Panel on colour",
                    "Oversized type","Almost nothing","Moving shapes","Split reversed"];
const HERO_ART   = ["No image","Gradient","Shapes","Interface"];

export const HERO_SPEC = {
  shape:    { discrete:true, values:[0,1,2,3,4,5,6,7,8], weight:1.7 },
  art:      { discrete:true, values:[0,1,2,3], weight:1.2 },
  size:     { range:[34,76], weight:1.1 },
  kicker:   { discrete:true, values:[0,1], weight:.7 },
  sub:      { discrete:true, values:[0,1], weight:.6 },
  actions:  { discrete:true, values:[1,2], weight:.7 },
  pad:      { range:[40,100], weight:.6 },
  tall:     { range:[440,620], weight:.5 },
  /* Added because hero was the one step where the options genuinely started
     to look alike — 93% distinct over 2,000, with the first look-alike at #70.
     These are all visible at a glance rather than numeric padding. */
  artShape: { discrete:true, values:[1,2,3], weight:1.0 },  // soft / hard / circular
  overlay:  { discrete:true, values:[0,1,2], weight:.8 },   // wash / scrim / none
  badge:    { discrete:true, values:[0,1], weight:.6 },     // trust line under the action
  ratio:    { range:[0.75,1.6], weight:.9 },                // split column balance
};

export const heroName = (g) => `${HERO_SHAPE[g.shape]} · ${HERO_ART[g.art]}`;

export function heroDetail(g) {
  const bits = [`${g.size.toFixed(0)}px headline`];
  if (g.kicker) bits.push("eyebrow");
  bits.push(g.sub ? "with a sub-line" : "headline only");
  bits.push(g.actions === 2 ? "two actions" : "one action");
  if (g.art) bits.push(["", "soft corners", "hard corners", "circular"][g.artShape] || "");
  if (g.shape === 3) bits.push(["gradient wash", "solid scrim", "no overlay"][g.overlay]);
  if (g.badge) bits.push("trust line");
  bits.push(g.tall > 560 ? "tall" : g.tall < 480 ? "short" : "standard height");
  return bits.filter(Boolean).join(", ");
}

export function renderHeroVariant(g, p, t, s) {
  const R = (n) => Math.min(s.radius, n);
  const pad = Math.round(g.pad), tall = Math.round(g.tall);
  const H = `font-family:${t.displayStack};font-weight:${t.weight};letter-spacing:${t.tracking}em;
    ${t.caps ? "text-transform:uppercase;" : ""}font-size:${g.size.toFixed(0)}px;line-height:1.04;color:${p.text}`;
  const sub = g.sub ? `<p style="font-family:${t.bodyStack};color:${p.muted};font-size:17px;
    line-height:1.6;margin:18px 0 0;max-width:460px">A short line carrying the promise.</p>` : "";
  const kick = g.kicker ? `<div style="font-family:${t.displayStack};font-size:12px;letter-spacing:.16em;
    text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:14px">New release</div>` : "";
  const btn = `<span style="display:inline-block;background:${p.accent};color:${p.onAccent};
    font-family:${t.displayStack};font-weight:700;font-size:15px;padding:14px 26px;
    border-radius:${R(14)}px">Get started</span>`;
  const btn2 = g.actions === 2 ? `<span style="display:inline-block;border:1px solid ${p.line};
    color:${p.text};font-family:${t.displayStack};font-weight:600;font-size:15px;padding:14px 24px;
    border-radius:${R(14)}px;margin-left:10px">Learn more</span>` : "";
  const artR = { 1:R(18), 2:0, 3:9999 }[g.artShape] || R(18);
  const badge = g.badge ? `<div style="font-family:${t.bodyStack};color:${p.muted};
    font-size:13px;margin-top:14px">No card needed · cancel anytime</div>` : "";
  const art = (h) => g.art === 0 ? "" :
    g.art === 3
      ? `<div style="background:${p.surface};border:${s.border}px solid ${p.line};border-radius:${artR}px;
           padding:18px;height:${h}px">${[92,70,84,58].map(w=>`<div style="height:12px;width:${w}%;
           border-radius:4px;background:${alpha(p.text,.1)};margin-bottom:11px"></div>`).join("")}
           <div style="height:${h-110}px;border-radius:${R(10)}px;background:${alpha(p.accent,.22)}"></div></div>`
      : g.art === 2
        ? `<div style="position:relative;height:${h}px">
             <div style="position:absolute;width:58%;padding-top:58%;border-radius:${g.artShape===2?"0":"50%"};
               background:${p.accent};opacity:.85;left:4%;top:6%"></div>
             <div style="position:absolute;width:44%;padding-top:44%;border-radius:${artR}px;
               background:${p.accent2};opacity:.85;right:6%;bottom:8%"></div></div>`
        : `<div style="height:${h}px;border-radius:${artR}px;
             background:linear-gradient(140deg,${p.accent},${p.accent2})"></div>`;

  const words = `${kick}<div style="${H}">Build something worth visiting</div>${sub}
    <div style="margin-top:28px">${btn}${btn2}</div>${badge}`;
  const wrap = (inner, extra="") => `<div style="background:${p.ground};min-height:${tall}px;${extra}">${inner}</div>`;

  let html;
  switch (g.shape) {
    case 0: html = wrap(`<div style="padding:${pad}px 52px;text-align:center;display:flex;
      flex-direction:column;align-items:center;justify-content:center;min-height:${tall}px">
      <div style="max-width:760px">${words}</div>${g.art?`<div style="width:70%;margin-top:36px">${art(220)}</div>`:""}</div>`); break;
    case 1: html = wrap(`<div style="padding:${pad}px 52px;display:flex;flex-direction:column;
      justify-content:center;min-height:${tall}px"><div style="max-width:72%">${words}</div></div>`); break;
    case 2:
    case 8: {
      const flip = g.shape === 8;
      html = wrap(`<div style="display:grid;grid-template-columns:${g.ratio.toFixed(2)}fr 1fr;gap:44px;align-items:center;
        padding:${pad}px 52px;min-height:${tall}px">
        <div style="${flip?"order:2":""}">${words}</div>
        <div style="${flip?"order:1":""}">${art(300) || `<div style="height:300px"></div>`}</div></div>`); break;
    }
    case 3: html = wrap(`<div style="position:relative;min-height:${tall}px;
      background:linear-gradient(150deg,${p.accent},${p.accent2});display:flex;align-items:flex-end">
      <div style="position:absolute;inset:0;background:${
        g.overlay === 0 ? `linear-gradient(transparent 30%,${alpha(p.ground,.9)})`
        : g.overlay === 1 ? alpha(p.ground,.55) : "transparent"}"></div>
      <div style="position:relative;padding:${pad}px 52px;max-width:70%">${words}</div></div>`); break;
    case 4: html = wrap(`<div style="background:${p.accent};padding:${pad}px 52px;display:grid;
      place-items:center;min-height:${tall}px">
      <div style="background:${p.surface};border-radius:${R(20)}px;padding:48px;max-width:70%;
        box-shadow:0 30px 70px ${alpha("#000",.35)}">${words}</div></div>`); break;
    case 5: html = wrap(`<div style="padding:${pad}px 52px;display:flex;flex-direction:column;
      justify-content:center;min-height:${tall}px">
      <div style="${H};font-size:${Math.max(g.size,64)}px;letter-spacing:-.05em">BUILD<br>SOMETHING</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:26px">
        <div style="max-width:44%">${sub}</div><div>${btn}${btn2}</div></div></div>`); break;
    case 6: html = wrap(`<div style="padding:${pad+30}px 52px;text-align:center;display:flex;
      flex-direction:column;justify-content:center;min-height:${tall}px">
      <div style="${H};font-size:${Math.min(g.size,40)}px;max-width:640px;margin:0 auto">
        Build something worth visiting</div>
      ${g.sub?`<p style="font-family:${t.bodyStack};color:${p.muted};font-size:16px;margin:18px auto 0;
        max-width:420px">A single line, and a great deal of space.</p>`:""}</div>`); break;
    default: html = wrap(`<div style="position:relative;overflow:hidden;min-height:${tall}px;
      display:flex;align-items:center;padding:${pad}px 52px">
      <div style="position:absolute;width:340px;height:340px;border-radius:50%;filter:blur(70px);
        background:${p.accent};opacity:.5;left:48%;top:-70px"></div>
      <div style="position:absolute;width:260px;height:260px;border-radius:50%;filter:blur(64px);
        background:${p.accent2};opacity:.5;right:4%;bottom:-50px"></div>
      <div style="position:relative;max-width:62%">${words}</div></div>`);
  }
  return { css:"", html: `<div class="pagefit"><div class="pagescale" style="width:${PAGE_W}px">${html}</div></div>` };
}
