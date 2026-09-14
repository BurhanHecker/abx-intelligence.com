/* ===========================================================================
   Assembly — one option at a time.

   The reel holds a single option. Arrow keys, the side pager, or the two
   action buttons move through it; nothing stacks and nothing scrolls past.
   Generated steps (colour, type, shape) are unbounded — index n is always the
   same option, so moving back and forth is stable. Catalogue steps wrap.
   =========================================================================== */

import { PALETTE_SPEC, TYPE_SPEC, SHAPE_SPEC, buildPalette, buildType, buildShape,
         genomeAt, distance } from "./genome.js?v=202609141200";
import { alpha, mix, onColor, contrast, luminance } from "./color.js?v=202609141200";
import { paletteCard, typeCard, shapeCard, miniSite, FALLBACK } from "./render.js?v=202609141200";
import { LAYOUTS, SECTIONS, SECTION_NAMES, COLOUR_BASES, STEPS } from "./catalogue.js?v=202609141200";
import { MENU_SPEC, BUTTON_SPEC, HERO_SPEC, MENU_POSITIONS,
         renderMenuVariant, renderButtonVariant, renderHeroVariant,
         menuName, buttonName, heroName,
         menuDetail, buttonDetail, heroDetail } from "./variants.js?v=202609141200";
import { renderSiteType, renderSection, primeSectionNames } from "./parts.js?v=202609141200";

primeSectionNames(SECTION_NAMES);

const $ = (id) => document.getElementById(id);
const reel = $("reel");

const state = {
  step: 0,
  seed: Math.floor(Math.random() * 1e9),
  i: 0,                       // position within the current step
  steer: null, steerName: "",
  pick: { site:null, base:null, palette:null, type:null, shape:null, menupos:null,
          menu:null, button:null, hero:null, sections:[] },
  manual: { ground:"#0E1013", text:"#F2F3F5", accent:"#FF3B21", accent2:"#3B82F6" },
};

const step = () => STEPS[state.step];

function ctx() {
  return {
    palette: state.pick.palette
      ? (state.pick.palette.manual || buildPalette(state.pick.palette.g))
      : FALLBACK.palette,
    type:    state.pick.type    ? buildType(state.pick.type.g)       : FALLBACK.type,
    shape:   state.pick.shape   ? buildShape(state.pick.shape.g)     : FALLBACK.shape,
  };
}

/* The list a catalogue step runs through. Sections depend on the chosen type,
   so a restaurant is never asked about a pricing table. */
function listFor(id) {
  if (id === "site")    return LAYOUTS;
  if (id === "base")    return COLOUR_BASES;
  if (id === "menupos") return MENU_POSITIONS;
  if (id === "sections") return SECTIONS.map(sid => ({ id:sid, name:SECTION_NAMES[sid] || sid }));
  return [];
}

/* ---- specs, colour base, and the two new chooser screens ----------------- */

const SPEC_OF = { palette:PALETTE_SPEC, type:TYPE_SPEC, shape:SHAPE_SPEC,
                  menu:MENU_SPEC, button:BUTTON_SPEC, hero:HERO_SPEC };

/* The base answer constrains the sampler rather than filtering its output, so
   the feed never runs dry hunting for a genome that happens to qualify. */
function applyBase(g) {
  const b = state.pick.base && state.pick.base.item.id;
  if (b === "light")   return { ...g, dark:0 };
  if (b === "dark")    return { ...g, dark:1 };
  if (b === "neutral") return { ...g, chroma:Math.min(g.chroma, .22),
                                hue:22 + (g.hue % 70),
                                neutralTint:Math.max(g.neutralTint, .10),
                                accentSat:Math.min(g.accentSat, .55) };
  return g;
}

function shell(inner, p, t, minH) {
  return `<div class="pagefit"><div class="pagescale" style="width:900px">
    <div style="background:${p.ground};min-height:${minH || 470}px;padding:54px 58px;
         font-family:${t.bodyStack}">${inner}</div></div></div>`;
}

function renderBase(item, c) {
  // each option is previewed in its own colours, not in the current ones
  const sample = {
    light:  { hue:215, harmony:2, dark:0, chroma:.5,  neutralTint:.02, depth:.05, accentPop:.45, accentSat:.85, warmth:0 },
    dark:   { hue:215, harmony:2, dark:1, chroma:.5,  neutralTint:.05, depth:.09, accentPop:.58, accentSat:.85, warmth:0 },
    neutral:{ hue:38,  harmony:1, dark:0, chroma:.18, neutralTint:.14, depth:.05, accentPop:.42, accentSat:.45, warmth:8 },
    manual: null,
  }[item.id];
  const p = sample ? buildPalette(sample) : c.palette;

  const body = item.id === "manual"
    ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:32px">
        ${[["Background","Most of the page"],["Text","Everything you read"],
           ["Accent","Buttons and links"],["Second","Highlights"]].map(([n,w])=>`
          <div><div style="height:74px;border-radius:10px;border:2px dashed ${alpha(p.text,.3)};
            display:grid;place-items:center;color:${p.muted};font-size:24px">+</div>
            <div style="font-family:${c.type.displayStack};font-size:13px;font-weight:700;
              margin-top:10px;color:${p.text}">${n}</div>
            <div style="font-size:13px;color:${p.muted}">${w}</div></div>`).join("")}</div>
       <p style="color:${p.muted};font-size:14px;margin-top:20px">
         You enter four colours; we check the text stays readable against the background.</p>`
    : `<div style="margin-top:32px">${miniSite(p, c.type, c.shape)}</div>`;

  return { css:"", html: shell(
    `<div style="font-family:${c.type.displayStack};font-weight:${c.type.weight};font-size:38px;
       color:${p.text};letter-spacing:${c.type.tracking}em">${item.name}</div>
     <p style="color:${p.muted};font-size:17px;margin:12px 0 0;max-width:540px">${item.note}</p>
     ${body}`, p, c.type) };
}

const isManual = () => state.pick.base && state.pick.base.item.id === "manual";

const MANUAL_ROLES = [
  ["ground",  "Background", "Most of the page"],
  ["text",    "Text",       "Everything you read"],
  ["accent",  "Accent",     "Buttons and links"],
  ["accent2", "Second",     "Highlights and second actions"],
];

/* A manual palette still has to pass the same contrast check a generated one
   does, so the warning is live rather than a note at the end. */
export function manualPalette() {
  const m = state.manual;
  return {
    dark: luminance(m.ground) < 0.4,
    ground: m.ground,
    surface: mix(m.ground, m.text, 0.07),
    text: m.text, muted: mix(m.ground, m.text, 0.55),
    accent: m.accent, accent2: m.accent2,
    line: mix(m.ground, m.text, 0.14),
    onAccent: onColor(m.accent),
    harmonyName: "Your own",
    contrastText: contrast(m.text, m.ground),
  };
}

function manualFace(c) {
  const p = manualPalette();
  const ratio = p.contrastText;
  const ok = ratio >= 4.5;
  return {
    face: {
      title: "Your own colours",
      sub: `Text contrast ${ratio.toFixed(1)}:1 — ${ok ? "readable" : "too low, WCAG wants 4.5:1"}`,
      html: `<div class="pagefit"><div class="pagescale" style="width:900px">
        <div style="background:${p.ground};min-height:470px;padding:48px 54px;font-family:${c.type.bodyStack}">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
            ${MANUAL_ROLES.map(([k, n, w]) => `
              <label style="display:block;cursor:pointer">
                <input type="color" class="mc" data-role="${k}" value="${state.manual[k]}">
                <span style="display:block;font-family:${c.type.displayStack};font-size:13px;
                  font-weight:700;margin-top:10px;color:${p.text}">${n}</span>
                <span style="display:block;font-size:12.5px;color:${p.muted}">${w}</span>
                <span style="display:block;font-family:ui-monospace,monospace;font-size:12px;
                  color:${p.muted};margin-top:3px">${state.manual[k]}</span>
              </label>`).join("")}
          </div>
          <div style="margin-top:28px;padding:12px 15px;border-radius:10px;
            background:${ok ? alpha(p.accent,.12) : "rgba(255,59,33,.16)"};
            color:${ok ? p.text : "#FF8A74"};font-size:13.5px">
            ${ok ? "Readable — text clears 4.5:1 against the background."
                 : "Text is hard to read on that background. Lighten the text or darken the background."}
          </div>
          <div style="margin-top:24px">${miniSite(p, c.type, c.shape)}</div>
        </div></div></div>`,
    },
    g: null, manual: true, css:"", key: "palette:manual",
  };
}

function renderMenuPos(item, c) {
  const p = c.palette, t = c.type, s = c.shape;
  const link = (l) => `<span style="font-size:12px;color:${p.muted}">${l}</span>`;
  const logo = `<span style="font-family:${t.displayStack};font-weight:700;font-size:13px;
    color:${p.text}">Studio</span>`;
  const box = (inner, extra="") => `<div style="display:flex;align-items:center;gap:18px;
    padding:14px 18px;background:${p.surface};border:${s.border}px solid ${p.line};
    border-radius:${Math.min(s.radius,12)}px;${extra}">${inner}</div>`;
  const links = ["Home","About","Contact"].map(link).join("");

  const lay = {
    left:   box(logo + links),
    right:  box(logo + `<span style="margin-left:auto;display:flex;gap:18px">${links}</span>`),
    centre: `<div style="display:flex;justify-content:center">${box(logo + links)}</div>`,
    split:  box(`<span style="display:flex;gap:18px">${link("Home")}${link("About")}</span>` +
                `<span style="margin:0 auto">${logo}</span>` +
                `<span style="display:flex;gap:18px">${link("Work")}${link("Contact")}</span>`),
    rail:   `<div style="display:flex;gap:16px">
               <div style="width:160px">${box(logo + `<span style="display:flex;flex-direction:column;
                 gap:10px;margin-top:10px">${links}</span>`, "flex-direction:column;align-items:flex-start")}</div>
               <div style="flex:1;border-radius:${Math.min(s.radius,12)}px;
                 background:${alpha(p.text,.05)};min-height:150px"></div></div>`,
  }[item.id];

  return { css:"", html: shell(
    `<div style="font-family:${t.displayStack};font-weight:${t.weight};font-size:36px;
       color:${p.text};letter-spacing:${t.tracking}em">${item.name}</div>
     <p style="color:${p.muted};font-size:17px;margin:10px 0 34px">${item.note}</p>
     ${lay}
     <div style="margin-top:26px;border-radius:${Math.min(s.radius,14)}px;
       background:${alpha(p.text,.04)};border:${s.border}px solid ${p.line};min-height:120px"></div>`,
    p, t) };
}

/* ---- building the single visible option ---------------------------------- */

function current() {
  const s = step();
  const c = ctx();

  if (s.id === "palette" && isManual()) return manualFace(c);

  if (s.kind === "generated") {
    const spec = SPEC_OF[s.id];
    let g = genomeAt(spec, state.seed, state.i, state.steer);
    if (s.id === "palette") g = applyBase(g);

    if (s.id === "menu") {
      const pos = state.pick.menupos ? state.pick.menupos.item : MENU_POSITIONS[1];
      const out = renderMenuVariant(g, pos, c.palette, c.type, c.shape);
      return { face:{ title:menuName(g),
                      sub:`${pos.name} · ${menuDetail(g)} · hover the links`,
                      html:out.html }, g, css:out.css, key:"menu:" + state.i };
    }
    if (s.id === "button") {
      const out = renderButtonVariant(g, c.palette, c.type, c.shape);
      return { face:{ title:buttonName(g), sub:`${buttonDetail(g)} · hover either button`,
                      html:out.html }, g, css:out.css, key:"button:" + state.i };
    }
    if (s.id === "hero") {
      const out = renderHeroVariant(g, c.palette, c.type, c.shape);
      return { face:{ title:heroName(g), sub:heroDetail(g), html:out.html },
               g, css:out.css, key:"hero:" + state.i };
    }
    const face = (s.id === "palette" ? paletteCard : s.id === "type" ? typeCard : shapeCard)(g, c);
    return { face, g, css:"", key:s.id + ":" + state.i };
  }

  const list = listFor(s.id);
  if (!list.length) return null;
  const item = list[((state.i % list.length) + list.length) % list.length];

  let out;
  if (s.id === "site")         out = renderSiteType(item, c.palette, c.type, c.shape);
  else if (s.id === "base")    out = renderBase(item, c);
  else if (s.id === "menupos") out = renderMenuPos(item, c);
  else                         out = renderSection(item.id, c.palette, c.type, c.shape);

  const sub = s.id === "site" ? item.look : (item.note || "");
  const title = s.id === "site" ? `${String(item.n).padStart(2, "0")}  ${item.name}` : item.name;
  return { face: { title, sub, uses:item.uses, html:out.html },
           css:out.css, item, key:s.id + ":" + item.id };
}

function draw(dir) {
  const cur = current();
  reel.innerHTML = "";
  if (!cur) { reel.innerHTML = `<div class="slide"><div class="slide-body">Nothing here.</div></div>`; return; }

  if (cur.css) {
    const st = document.createElement("style");
    st.textContent = cur.css;
    reel.appendChild(st);
  }

  const slide = document.createElement("div");
  slide.className = "slide " + (dir === "up" ? "in-up" : "in-down");
  slide.innerHTML = `<div class="slide-body"></div>
                     <div class="slide-name"><h3></h3><p></p></div>`;
  slide.querySelector(".slide-body").innerHTML = cur.face.html;
  // scoped to .slide-name: the preview inside .slide-body has its own h3s and
  // <p>s, and an unscoped query overwrites the client's own page copy
  slide.querySelector(".slide-name h3").textContent = cur.face.title;
  slide.querySelector(".slide-name p").textContent = cur.face.sub || "";
  reel.appendChild(slide);

  fitPage(slide);
  slide.querySelectorAll("input.mc").forEach(el => {
    el.addEventListener("input", () => {
      state.manual[el.dataset.role] = el.value;
      draw("down");                       // repaint: contrast and preview both move
    });
    el.addEventListener("click", (e) => e.stopPropagation());
  });
  paintChrome(cur);
}

function paintChrome(cur) {
  const s = step();
  $("sec-title").textContent = s.title;
  $("sec-note").textContent =
    s.kind === "generated" ? "Unlimited — keep going until one lands."
    : s.id === "sections"  ? "Add as many as you like — most sites use five or six."
    : s.id === "site"      ? "This decides everything you are asked next."
    : "Hover the preview to see how it behaves.";

  // what this option is usually reached for, said at the top where it frames
  // everything below it rather than at the bottom where it is a footnote
  const uses = $("sec-uses");
  if (cur && cur.face && cur.face.uses && cur.face.uses.length) {
    const u = cur.face.uses.map(x => x.toLowerCase());
    uses.innerHTML = "";
    uses.append(document.createTextNode("Usually reached for on "));
    u.forEach((x, i) => {
      const b = document.createElement("b"); b.textContent = x;
      uses.append(b, document.createTextNode(
        i === u.length - 1 ? "." : i === u.length - 2 ? " and " : ", "));
    });
    uses.hidden = false;
  } else uses.hidden = true;

  const multi = s.kind === "multi";
  const list = s.kind === "generated" ? null : listFor(s.id);
  $("counter").textContent = multi
    ? `${state.pick.sections.length} of ${list.length} added`
    : list
      ? `${(((state.i % list.length) + list.length) % list.length) + 1} of ${list.length}`
      : `option ${state.i + 1} of ∞`;

  // the like button is contextual, as asked
  const noun = { site:"layouts", palette:"colours", type:"pairings", shape:"shapes",
                 menu:"menus", button:"buttons", hero:"heroes", sections:"parts" }[s.id] || "options";
  $("like-label").textContent = "More " + noun + " like this";
  $("act-like").hidden = s.kind === "multi" || s.id === "site";

  const chosen = multi && cur.item && state.pick.sections.includes(cur.item.id);
  $("pick-label").textContent = multi ? (chosen ? "Added — click to remove" : "Add this") : "Select";
  $("act-pick").classList.toggle("on", !!chosen);
  $("done-btn").hidden = !multi;

  $("up").disabled = s.kind === "generated" && state.i === 0;
  $("steer").hidden = !state.steer;
  $("steer-name").textContent = state.steerName;

  // steps
  const steps = $("steps");
  steps.innerHTML = "";
  STEPS.forEach((st, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = st.label;
    b.className = (i === state.step ? "on " : "") + (done(i) ? "ok" : "");
    b.disabled = i > reach();
    b.addEventListener("click", () => go(i));
    steps.appendChild(b);
  });

  // running list
  const sofar = $("sofar");
  sofar.innerHTML = "<h4>Your site so far</h4>";
  const rows = [
    ["Layout",state.pick.site && state.pick.site.item.name],
    ["Colour",state.pick.palette && state.pick.palette.title],
    ["Fonts", state.pick.type && state.pick.type.title],
    ["Shape", state.pick.shape && state.pick.shape.title],
    ["Base",  state.pick.base && state.pick.base.item.name],
    ["Nav spot", state.pick.menupos && state.pick.menupos.item.name],
    ["Menu",  state.pick.menu && state.pick.menu.title],
    ["Button",state.pick.button && state.pick.button.title],
    ["Hero",  state.pick.hero && state.pick.hero.title],
    ["Parts", state.pick.sections.length ? state.pick.sections.length + " added" : null],
  ];
  rows.forEach(([k, v]) => {
    const row = document.createElement("div");
    row.className = "row" + (v ? "" : " none");
    row.innerHTML = `<span class="k"></span><span class="v"></span>`;
    row.querySelector(".k").textContent = k;
    row.querySelector(".v").textContent = v || "—";
    if (k === "Colour" && state.pick.palette) {
      const p = buildPalette(state.pick.palette.g);
      const d = document.createElement("span"); d.className = "dots";
      [p.ground, p.surface, p.accent, p.accent2].forEach(c => {
        const i = document.createElement("i"); i.style.background = c; d.appendChild(i);
      });
      row.appendChild(d);
    }
    sofar.appendChild(row);
  });

  const prev = document.createElement("div");
  prev.style.cssText = "margin-top:14px;border:1px solid var(--line);border-radius:var(--r);padding:10px;background:var(--ground-2)";
  prev.innerHTML = miniSite(ctx().palette, ctx().type, ctx().shape);
  sofar.appendChild(prev);
}

/* The preview is a real page at real width; scale it so the whole thing sits
   inside the stage. Re-run on resize, or a wide window leaves it cropped. */
function fitPage(root) {
  const fit = (root || document).querySelector(".pagefit");
  if (!fit) return;
  const page = fit.querySelector(".pagescale");
  if (!page) return;
  const scale = fit.clientWidth / page.offsetWidth;
  page.style.transform = `scale(${scale})`;
  fit.style.height = page.offsetHeight * scale + "px";
}
let fitTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(fitTimer);
  fitTimer = setTimeout(() => fitPage(document), 120);
});

/* ---- movement ------------------------------------------------------------ */

function move(d) {
  const s = step();
  if (s.kind === "generated" && state.i + d < 0) return;
  state.i += d;
  draw(d > 0 ? "down" : "up");
}

function like() {
  const s = step();
  const cur = current();
  if (s.kind === "generated") {
    state.steer = cur.g; state.steerName = cur.face.title;
    state.i = 0; draw("down");
  } else if (s.id === "menu" || s.id === "button" || s.id === "hero") {
    // catalogues are short: nothing to steer toward, so jump onward instead
    move(1);
  }
}

function select() {
  const s = step();
  const cur = current();
  if (!cur) return;

  if (s.kind === "multi") {
    const id = cur.item.id;
    const at = state.pick.sections.indexOf(id);
    if (at >= 0) state.pick.sections.splice(at, 1);
    else state.pick.sections.push(id);
    draw("down");
    return;
  }

  if (s.id === "palette" && isManual())
    state.pick.palette = { g:null, manual:manualPalette(), title:"Your own colours" };
  else if (s.kind === "generated") state.pick[s.id] = { g: cur.g, title: cur.face.title };
  else state.pick[s.id] = { item: cur.item, title: cur.face.title };

  if (state.step < STEPS.length - 1) go(state.step + 1);
  else draw("down");
}

function go(i) {
  state.step = i;
  state.i = 0;
  state.steer = null; state.steerName = "";
  if (STEPS[i].id === "review") { review(); return; }
  $("done").hidden = true;
  document.querySelector(".stage-sec").hidden = false;
  draw("down");
  $("stage").scrollIntoView({ behavior:"smooth", block:"start" });
}

const done = (i) => {
  const s = STEPS[i];
  if (s.kind === "multi") return state.pick.sections.length > 0;
  if (s.kind === "review") return false;
  return !!state.pick[s.id];
};
const reach = () => {
  for (let i = 0; i < STEPS.length - 1; i++) if (!done(i)) return i;
  return STEPS.length - 1;
};

/* ---- review -------------------------------------------------------------- */

function brief() {
  const c = ctx();
  const P = state.pick;
  return {
    submittedAt: new Date().toISOString(),
    layout: P.site ? { id:P.site.item.id, name:P.site.item.name, usedFor:P.site.item.uses } : null,
    palette: P.palette ? { name:P.palette.title, mode:c.palette.dark ? "dark" : "light",
      ground:c.palette.ground, surface:c.palette.surface, text:c.palette.text,
      muted:c.palette.muted, accent:c.palette.accent, second:c.palette.accent2,
      genome:P.palette.g } : null,
    type: P.type ? { display:c.type.displayName, body:c.type.bodyName,
      scale:+c.type.scale.toFixed(3), weight:c.type.weight, caps:c.type.caps,
      genome:P.type.g } : null,
    shape: P.shape ? { name:c.shape.name, radius:c.shape.radius, border:c.shape.border,
      motionMs:c.shape.ms, genome:P.shape.g } : null,
    colourBase: P.base ? P.base.item.id : null,
    navigation: P.menu ? { name:P.menu.title, genome:P.menu.g,
      position: P.menupos ? P.menupos.item.id : null } : null,
    buttons: P.button ? { name:P.button.title, genome:P.button.g } : null,
    hero: P.hero ? { name:P.hero.title, genome:P.hero.g } : null,
    sections: P.sections.map(id => ({ id, name:SECTION_NAMES[id] })),
  };
}

function review() {
  document.querySelector(".stage-sec").hidden = true;
  const b = brief(), c = ctx(), done = $("done");
  done.hidden = false;
  done.innerHTML = `
    <h1>Your brief</h1>
    <p class="lede2">This is what we would build. Send it and we come back with a quote and a timeline.</p>
    <div class="done-grid">
      <div class="brief">
        <h3>The design</h3>
        <dl>
          <dt>Layout</dt><dd>${b.layout ? b.layout.name : "—"}</dd>
          <dt>Colour</dt><dd>${b.palette ? b.palette.name + " · " + b.palette.accent : "—"}</dd>
          <dt>Fonts</dt><dd>${b.type ? b.type.display + " + " + b.type.body : "—"}</dd>
          <dt>Shape</dt><dd>${b.shape ? b.shape.name + " · " + b.shape.radius + "px" : "—"}</dd>
          <dt>Menu</dt><dd>${b.navigation ? b.navigation.name + " · " + (b.navigation.position||"") : "—"}</dd>
          <dt>Buttons</dt><dd>${b.buttons ? b.buttons.name : "—"}</dd>
          <dt>Hero</dt><dd>${b.hero ? b.hero.name : "—"}</dd>
        </dl>
        <h3>Sections (${b.sections.length})</h3>
        <div class="comp-list">${b.sections.map(() => "<span></span>").join("") || "<span>none</span>"}</div>
        <h3 style="margin-top:22px">What gets sent to ABX</h3>
        <div class="payload" id="b-payload"></div>
      </div>
      <div>
        <div class="prevbox"><div class="prevlabel">Your site</div><div id="b-prev"></div></div>
        <form class="who" id="who-form" novalidate>
          <h3>Where do we send the quote?</h3>
          <label for="w-name">Your name</label><input id="w-name" name="name" type="text" required>
          <label for="w-email">Email</label><input id="w-email" name="email" type="email" required>
          <label for="w-org">Company <span>optional</span></label><input id="w-org" name="organisation" type="text">
          <label for="w-note">Anything else <span>optional</span></label>
          <textarea id="w-note" name="note" rows="3" placeholder="Deadline, budget, pages you know you need…"></textarea>
          <div class="honeypot" aria-hidden="true">
            <label for="botcheck">Leave this empty</label>
            <input id="botcheck" name="botcheck" type="checkbox" tabindex="-1" autocomplete="off">
          </div>
        </form>
        <button class="done-btn" id="send" type="button" style="width:100%">Send to ABX</button>
        <p class="sendnote" id="send-note">Nothing is sent until you press this.</p>
        <button class="ghostbtn" id="back" type="button">Back to the sections</button>
      </div>
    </div>`;
  [...done.querySelectorAll(".comp-list span")].forEach((el, i) => {
    if (b.sections[i]) el.textContent = b.sections[i].name;
  });
  $("b-payload").textContent = JSON.stringify(b, null, 2);
  $("b-prev").innerHTML = miniSite(c.palette, c.type, c.shape);
  $("back").addEventListener("click", () => go(STEPS.findIndex(s => s.kind === "multi")));
  $("send").addEventListener("click", send);
  window.scrollTo({ top: done.offsetTop - 90, behavior:"smooth" });
}

const WEB3FORMS_KEY = "b434f8c5-c638-46b9-b287-932cbf921a8e";

async function send() {
  const btn = $("send"), note = $("send-note"), form = $("who-form");
  const name = form.name.value.trim(), email = form.email.value.trim();
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    note.textContent = "Please add your name and a valid email so we can reply.";
    (!name ? form.name : form.email).focus(); return;
  }
  if (form.botcheck.checked) return;

  const b = brief();
  btn.disabled = true; btn.textContent = "Sending…"; note.textContent = "Sending your brief.";
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method:"POST", headers:{ "Content-Type":"application/json", Accept:"application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `New site brief — ${name}`,
        from_name: "ABX Assembly", replyto: email, botcheck: "",
        Name:name, Email:email,
        Company: form.organisation.value.trim() || "—",
        Notes: form.note.value.trim() || "—",
        "Layout": b.layout ? b.layout.name : "—",
        "Colour": b.palette ? `${b.palette.name} — ${b.palette.accent} on ${b.palette.ground}` : "—",
        "Fonts": b.type ? `${b.type.display} + ${b.type.body}` : "—",
        "Shape": b.shape ? `${b.shape.name}, ${b.shape.radius}px` : "—",
        "Menu": b.navigation ? b.navigation.name : "—",
        "Buttons": b.buttons ? b.buttons.name : "—",
        "Hero": b.hero ? b.hero.name : "—",
        "Sections": b.sections.map(s => s.name).join(", ") || "—",
        "Full brief (JSON)": JSON.stringify(b, null, 2),
      }),
    });
    const out = await res.json();
    if (!out.success) throw new Error(out.message || "Web3Forms rejected it.");
    btn.textContent = "Brief sent";
    note.textContent = "Thank you — your brief is with ABX.";
    form.querySelectorAll("input,textarea").forEach(el => el.disabled = true);
  } catch (e) {
    btn.disabled = false; btn.textContent = "Send to ABX";
    note.textContent = "Could not send: " + e.message;
  }
}


/* ---------------------------------------------------------------------------
   The intro. Nobody reads an instruction line, so a cursor does the tour: it
   moves to each real control, taps it, and says what it is for. It points at
   the actual buttons rather than pictures of them, so what you learn is where
   they really are.
   --------------------------------------------------------------------------- */
const stageBox = document.getElementById("stage-box");
const ghost = $("ghost"), ghostSay = $("ghost-say");
let introDone = false;

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function moveGhost(el, say, dx = 0, dy = 0) {
  const a = stageBox.getBoundingClientRect(), b = el.getBoundingClientRect();
  const x = b.left - a.left + b.width / 2 - 13 + dx;
  const y = b.top - a.top + b.height / 2 - 4 + dy;
  ghost.hidden = false;
  ghost.style.transform = `translate(${x}px, ${y}px)`;
  if (say) {
    ghostSay.hidden = false;
    ghostSay.textContent = say;
    // sit the caption to the left of the control, which is always on the right
    ghostSay.style.transform = `translate(${x - ghostSay.offsetWidth - 16}px, ${y - 8}px)`;
  }
}

async function tap(el) {
  ghost.classList.add("tap");
  el.classList.add("highlit");
  await wait(reduced ? 0 : 620);
  ghost.classList.remove("tap");
  el.classList.remove("highlit");
}

async function runIntro() {
  $("intro-start").hidden = true;
  stageBox.classList.add("introing");

  if (!reduced) {
    const steps = [
      [$("down"),     "Move to the next one"],
      [$("act-like"), "More like this one"],
      [$("act-pick"), "Choose it, and move on"],
    ];
    for (const [el, say] of steps) {
      moveGhost(el, say);
      await wait(900);
      await tap(el);
      await wait(220);
    }
    ghost.hidden = true; ghostSay.hidden = true;
    await wait(200);
  }

  // the title card, then out of the way
  const card = $("intro-title");
  card.hidden = false;
  await wait(reduced ? 300 : 1500);
  card.hidden = true;

  stageBox.classList.remove("introing");
  $("intro").hidden = true;
  introDone = true;
  draw("down");
}

$("intro-go").addEventListener("click", runIntro);
$("intro").hidden = false;

/* ---- wiring -------------------------------------------------------------- */

$("down").addEventListener("click", () => move(1));
$("up").addEventListener("click", () => move(-1));
$("act-like").addEventListener("click", like);
$("act-pick").addEventListener("click", select);
$("steer-clear").addEventListener("click", () => { state.steer = null; state.i = 0; draw("down"); });
$("done-btn").addEventListener("click", () => go(STEPS.length - 1));

// arrow keys drive the reel, but never while someone is filling the form
document.addEventListener("keydown", (e) => {
  if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
  if (!$("done").hidden || !introDone) return;
  if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
  else if (e.key === "Enter") { e.preventDefault(); select(); }
});

$("f-combos").textContent = "5.9 quintillion";
draw("down");            // paints the chrome; the intro sits over the reel
