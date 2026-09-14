/* ===========================================================================
   Genome -> something you can look at.

   Every card in the feed shows a miniature of the real thing, built from the
   choices made so far. Pick a palette and the type cards arrive in that
   palette; pick type too and the component cards use both. The client is
   always looking at their own site, not a swatch.
   =========================================================================== */

import { alpha, mix, onColor } from "./color.js";
import { buildPalette, buildType, buildShape, PALETTE_SPEC, TYPE_SPEC, SHAPE_SPEC } from "./genome.js";

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

/* Defaults so a section can be previewed before the earlier ones are done. */
export const FALLBACK = {
  palette: buildPalette({ hue: 220, harmony: 2, dark: 1, chroma: .5, neutralTint: .05,
                          depth: .08, accentPop: .55, accentSat: .8, warmth: 0 }),
  type:    buildType({ display: 0, body: 12, scale: 1.33, tracking: 0, dWeight: 700, caseMode: 0 }),
  shape:   buildShape({ radius: 10, border: 1, density: 1, shadow: .4, motion: .4, elevation: 1 }),
};

/* The miniature site. Deliberately one component of each kind — nav, hero,
   button, cards, footer — because those are what make a palette feel right or
   wrong, and a row of colour chips does not. */
export function miniSite(p, t, s, opts = {}) {
  const pad = (n) => (n * s.density).toFixed(1) + "px";
  const card = `background:${p.surface};border:${s.border}px solid ${p.line};border-radius:${s.radius}px;box-shadow:${s.shadowCss};`;
  const headline = opts.headline || "Build something worth visiting";

  return `
  <div class="mini" style="background:${p.ground};color:${p.text};font-family:${t.bodyStack};">
    <div class="mini-nav" style="border-bottom:${s.border}px solid ${p.line};padding:${pad(9)} ${pad(13)};">
      <span style="font-family:${t.displayStack};font-weight:${t.weight};letter-spacing:${t.tracking}em;
                   ${t.caps ? "text-transform:uppercase;" : ""}font-size:11px;">Studio</span>
      <span class="mini-links" style="color:${p.muted};">
        <i>Work</i><i>About</i>
        <b style="background:${p.accent};color:${p.onAccent};border-radius:${Math.min(s.radius, 14)}px;">Start</b>
      </span>
    </div>

    <div style="padding:${pad(16)} ${pad(13)} ${pad(13)};">
      <div style="font-family:${t.displayStack};font-weight:${t.weight};letter-spacing:${t.tracking}em;
                  ${t.caps ? "text-transform:uppercase;" : ""}
                  font-size:${(15 * t.scale).toFixed(1)}px;line-height:1.1;margin-bottom:${pad(6)};">
        ${esc(headline)}
      </div>
      <div style="color:${p.muted};font-size:9.5px;line-height:1.5;margin-bottom:${pad(9)};">
        A short line of body copy, set in ${esc(t.bodyName)}, showing how the two faces sit together.
      </div>
      <span style="display:inline-block;background:${p.accent};color:${p.onAccent};
                   border-radius:${Math.min(s.radius, 18)}px;padding:${pad(5)} ${pad(11)};
                   font-size:9px;font-weight:700;font-family:${t.displayStack};">Get started</span>
    </div>

    <div style="display:flex;gap:${pad(7)};padding:0 ${pad(13)} ${pad(13)};">
      <div style="${card}flex:1;padding:${pad(9)};">
        <div style="width:22px;height:3px;background:${p.accent};border-radius:2px;margin-bottom:${pad(6)};"></div>
        <div style="font-size:9px;font-weight:700;margin-bottom:3px;font-family:${t.displayStack};">Feature</div>
        <div style="color:${p.muted};font-size:8px;line-height:1.45;">Supporting detail in one line.</div>
      </div>
      <div style="${card}flex:1;padding:${pad(9)};">
        <div style="width:22px;height:3px;background:${p.accent2};border-radius:2px;margin-bottom:${pad(6)};"></div>
        <div style="font-size:9px;font-weight:700;margin-bottom:3px;font-family:${t.displayStack};">Feature</div>
        <div style="color:${p.muted};font-size:8px;line-height:1.45;">Supporting detail in one line.</div>
      </div>
    </div>

    <div style="border-top:${s.border}px solid ${p.line};padding:${pad(8)} ${pad(13)};
                color:${p.muted};font-size:8px;display:flex;justify-content:space-between;">
      <span>© Studio</span><span>hello@studio.com</span>
    </div>
  </div>`;
}

/* ---- per-section card faces ---------------------------------------------- */

export function paletteCard(g, ctx) {
  const p = buildPalette(g);
  /* Four, named and with their codes — the ones a developer would be handed.
     Surface is left out: it is a shade of the background, not a decision. */
  const roles = [["Background", p.ground], ["Text", p.text],
                 ["Accent", p.accent], ["Second", p.accent2]];
  return {
    title: `${p.harmonyName} · ${p.dark ? "Dark" : "Light"}`,
    sub: `${p.accent} on ${p.ground} · text contrast ${p.contrastText.toFixed(1)}:1`,
    html: miniSite(p, ctx.type, ctx.shape) + `
      <div class="swatches">
        ${roles.map(([n, c]) => `
          <div class="sw">
            <span class="chip" style="background:${c}"></span>
            <span class="lab">${n}</span>
            <span class="hex">${c}</span>
          </div>`).join("")}
      </div>`,
  };
}

export function typeCard(g, ctx) {
  const t = buildType(g);
  const p = ctx.palette;
  return {
    title: `${t.displayName} + ${t.bodyName}`,
    sub: `Scale ${t.scale.toFixed(2)} · weight ${t.weight}${t.caps ? " · caps" : ""}`,
    html: `
      <div class="specimen" style="background:${p.ground};color:${p.text};">
        <div style="font-family:${t.displayStack};font-weight:${t.weight};
                    letter-spacing:${t.tracking}em;${t.caps ? "text-transform:uppercase;" : ""}
                    font-size:${(22 * t.scale).toFixed(1)}px;line-height:1.05;">
          Aa Gg Rq
        </div>
        <div style="font-family:${t.bodyStack};color:${p.muted};font-size:11px;line-height:1.55;margin-top:8px;">
          The quick brown fox jumps over the lazy dog, set at a comfortable
          reading size so the pairing can be judged properly.
        </div>
      </div>` + miniSite(p, t, ctx.shape),
  };
}

export function shapeCard(g, ctx) {
  const s = buildShape(g);
  return {
    title: s.name,
    sub: `${s.radius}px corners · ${s.border}px border · ${s.ms}ms motion`,
    html: miniSite(ctx.palette, ctx.type, s),
  };
}

/* ---- components ----------------------------------------------------------
   These get a working miniature rather than a picture, because how a carousel
   or a news band behaves is the thing being chosen. */
export function componentCard(c, ctx) {
  const p = ctx.palette, t = ctx.type, s = ctx.shape;
  const box = `background:${p.surface};border:${s.border}px solid ${p.line};border-radius:${s.radius}px;`;
  let demo = "";

  if (c.id === "carousel") {
    demo = `<div class="demo-carousel" style="${box}overflow:hidden;">
      <div class="dc-track">${[0,1,2].map(i =>
        `<div class="dc-slide" style="background:${[p.accent,p.accent2,mix(p.accent,p.text,.4)][i]}"></div>`).join("")}</div>
      <div class="dc-dots">${[0,1,2].map(i => `<i style="background:${i===0?p.accent:p.muted}"></i>`).join("")}</div>
    </div>`;
  } else if (c.id === "news-band") {
    demo = `<div class="demo-band" style="${box}overflow:hidden;background:${p.accent};color:${p.onAccent};">
      <div class="db-rot">
        <div class="db-item"><b>Notice</b> Excursion places open Monday</div>
        <div class="db-item"><b>Sport</b> Senior finals moved to Thursday</div>
        <div class="db-item"><b>Arts</b> Winter showcase tickets live</div>
      </div>
    </div>`;
  } else if (c.id === "ticker") {
    demo = `<div class="demo-ticker" style="${box}background:${p.surface};color:${p.text};overflow:hidden;">
      <div class="dt-run">Latest · Admissions open · Open day 14 March · Latest · Admissions open · Open day 14 March ·&nbsp;</div>
    </div>`;
  } else if (c.id === "before-after") {
    demo = `<div class="demo-ba" style="${box}overflow:hidden;">
      <div class="ba-a" style="background:${p.accent2}"></div>
      <div class="ba-b" style="background:${p.accent}"></div>
      <div class="ba-handle" style="background:${p.text}"></div>
    </div>`;
  } else if (c.id === "stats") {
    demo = `<div style="${box}display:flex;padding:14px;gap:14px;">
      ${[["120","Projects"],["18","Countries"],["99%","Uptime"]].map(([n,l])=>
        `<div style="flex:1"><div style="font-family:${t.displayStack};font-weight:${t.weight};
          font-size:20px;color:${p.accent};line-height:1">${n}</div>
          <div style="color:${p.muted};font-size:9px;margin-top:3px">${l}</div></div>`).join("")}
    </div>`;
  } else if (c.id === "accordion") {
    demo = `<div style="${box}overflow:hidden;">
      ${["What do you build?","How long does it take?","What does it cost?"].map((q,i)=>
        `<div style="padding:10px 12px;${i?`border-top:${s.border}px solid ${p.line};`:""}
          display:flex;justify-content:space-between;font-size:10px;
          ${i===0?`color:${p.accent};font-weight:700;`:`color:${p.text};`}">
          <span>${q}</span><span style="color:${p.muted}">${i===0?"–":"+"}</span></div>`).join("")}
    </div>`;
  } else if (c.id === "pricing") {
    demo = `<div style="display:flex;gap:8px;">
      ${["Starter","Studio","Scale"].map((n,i)=>
        `<div style="${box}flex:1;padding:10px;${i===1?`border-color:${p.accent};border-width:2px;`:""}">
          <div style="font-size:9px;color:${p.muted}">${n}</div>
          <div style="font-family:${t.displayStack};font-weight:${t.weight};font-size:15px;
            color:${i===1?p.accent:p.text};margin-top:2px">£${[9,29,79][i]}</div>
        </div>`).join("")}
    </div>`;
  } else if (c.id === "gallery-grid") {
    demo = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">
      ${[0,1,2,3,4,5].map(i=>`<div style="height:${i%3===1?46:32}px;border-radius:${Math.min(s.radius,10)}px;
        background:${mix(p.accent, p.surface, i/6)}"></div>`).join("")}
    </div>`;
  } else if (c.id === "contact" || c.id === "newsletter") {
    demo = `<div style="${box}padding:12px;">
      ${(c.id==="contact"?["Name","Email"]:["Email"]).map(l=>
        `<div style="border:${Math.max(1,s.border)}px solid ${p.line};border-radius:${Math.min(s.radius,10)}px;
          padding:7px 9px;margin-bottom:7px;color:${p.muted};font-size:9px">${l}</div>`).join("")}
      <div style="background:${p.accent};color:${p.onAccent};border-radius:${Math.min(s.radius,14)}px;
        padding:7px;text-align:center;font-size:9px;font-weight:700">Send</div>
    </div>`;
  } else {
    // generic: a labelled block in the client's own palette
    demo = `<div style="${box}padding:16px;display:flex;align-items:center;gap:10px;">
      <div style="width:30px;height:30px;border-radius:${Math.min(s.radius,10)}px;background:${p.accent};
                  display:flex;align-items:center;justify-content:center;color:${p.onAccent};
                  font-weight:800;font-size:13px;font-family:${t.displayStack}">
        ${esc(c.name[0])}
      </div>
      <div><div style="font-size:10px;font-weight:700;font-family:${t.displayStack}">${esc(c.name)}</div>
      <div style="color:${p.muted};font-size:9px;margin-top:2px">${esc(c.note)}</div></div>
    </div>`;
  }

  return {
    title: c.name,
    sub: `${c.group} · ${c.note}`,
    html: `<div class="comp-demo" style="background:${p.ground};padding:14px;">${demo}</div>`,
  };
}
