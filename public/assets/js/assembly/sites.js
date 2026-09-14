/* ===========================================================================
   One real page per layout.

   Each is rendered at full width and scaled down, so proportions stay honest —
   a skeleton of grey bars cannot show whether a layout breathes. The layouts
   are Figma's twelve; the content is invented.
   =========================================================================== */

import { alpha, mix } from "./color.js?v=202609141200";

export const PAGE_W = 1180;
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

export function renderPage(id, p, t, s) {
  const R = (n) => Math.min(s.radius, n);
  const D = (n) => Math.round(n * s.density);
  const H = (size, w) => `font-family:${t.displayStack};font-weight:${w || t.weight};
    letter-spacing:${t.tracking}em;${t.caps ? "text-transform:uppercase;" : ""}
    font-size:${size}px;line-height:1.07;color:${p.text}`;
  const B = (size, c) => `font-family:${t.bodyStack};font-size:${size}px;line-height:1.6;color:${c || p.muted}`;
  const btn = (l, big) => `<span style="display:inline-block;background:${p.accent};color:${p.onAccent};
    font-family:${t.displayStack};font-weight:700;font-size:${big?16:13}px;
    padding:${big?"14px 28px":"10px 18px"};border-radius:${R(big?16:11)}px">${esc(l)}</span>`;
  const ghost = (l) => `<span style="display:inline-block;border:${Math.max(1,s.border)}px solid ${p.line};
    color:${p.text};font-family:${t.displayStack};font-weight:600;font-size:13px;
    padding:10px 18px;border-radius:${R(11)}px">${esc(l)}</span>`;
  const card = `background:${p.surface};border:${s.border}px solid ${p.line};border-radius:${R(16)}px`;
  const img = (h, a, b2) => `<div style="height:${h}px;border-radius:${R(14)}px;
    background:linear-gradient(${a||135}deg,${p.accent},${p.accent2} ${b2||68}%,${mix(p.accent2,p.text,.28)})"></div>`;
  const nav = (brand, links, cta) => `<div style="display:flex;align-items:center;gap:30px;
      padding:${D(20)}px ${D(48)}px;border-bottom:${s.border}px solid ${p.line}">
      <span style="${H(20)}">${esc(brand)}</span>
      <span style="display:flex;gap:24px;margin-left:auto;${B(14)}">
      ${links.map(l=>`<span>${esc(l)}</span>`).join("")}</span>${cta?btn(cta):""}</div>`;
  const foot = (brand) => `<div style="padding:${D(26)}px ${D(48)}px;border-top:${s.border}px solid ${p.line};
      display:flex;justify-content:space-between;${B(13)}">
      <span>© ${esc(brand)}</span><span>hello@example.com</span></div>`;
  const page = (inner) => `<div style="width:${PAGE_W}px;background:${p.ground};color:${p.text};
      font-family:${t.bodyStack}">${inner}</div>`;

  switch (id) {

  case "grid": return page(
    nav("SALT", ["New in","Shop","Journal","Account"], "Basket (2)") +
    `<div style="padding:${D(36)}px ${D(48)}px;display:flex;align-items:baseline;gap:16px">
      <div style="${H(34)}">Everything</div>
      <div style="${B(15)};margin-left:auto">248 items · Newest first</div></div>
     <div style="padding:0 ${D(48)}px ${D(40)}px;display:grid;grid-template-columns:repeat(4,1fr);
       gap:${D(18)}px">
      ${[["Linen overshirt","48.00"],["Cotton crew","26.00"],["Wide trouser","62.00"],["Canvas tote","34.00"],
         ["Wool scarf","29.00"],["Leather belt","44.00"],["Knit beanie","19.00"],["Chore jacket","88.00"]]
        .map(([n,pr],i)=>`<div>${img(190, 110+i*18, 60)}
        <div style="display:flex;justify-content:space-between;margin-top:9px;${B(13,p.text)}">
        <span>${esc(n)}</span><span style="font-family:${t.displayStack};font-weight:700">${esc(pr)}</span>
        </div></div>`).join("")}</div>` + foot("SALT"));

  case "split": return page(
    `<div style="display:grid;grid-template-columns:1fr 1fr;min-height:560px">
      <div style="padding:${D(56)}px ${D(48)}px;display:flex;flex-direction:column;justify-content:center">
        <div style="${H(19)};margin-bottom:${D(34)}px">Ledger</div>
        <div style="${H(42)}">Close the books<br>in a morning.</div>
        <p style="${B(17)};margin:${D(18)}px 0 ${D(28)}px;max-width:400px">
          Every account reconciled overnight, so month-end is a review rather than a rescue.</p>
        <div style="display:flex;gap:10px">${btn("Start free trial",true)}${ghost("Book a demo")}</div>
        <div style="${B(13)};margin-top:${D(26)}px">No card. Cancel whenever.</div>
      </div>
      <div style="background:linear-gradient(160deg,${p.accent},${p.accent2});padding:${D(48)}px;
        display:flex;align-items:center">
        <div style="${card};padding:${D(22)}px;width:100%;box-shadow:0 30px 70px ${alpha("#000",.35)}">
          <div style="display:flex;gap:7px;margin-bottom:16px">${[0,1,2].map(()=>
            `<div style="width:9px;height:9px;border-radius:50%;background:${alpha(p.text,.18)}"></div>`).join("")}</div>
          ${[["Revenue","£84,120"],["Expenses","£31,904"],["Reconciled","2,881 of 2,881"]].map(([k,v])=>
            `<div style="display:flex;justify-content:space-between;padding:${D(13)}px 0;
              border-bottom:${s.border}px solid ${p.line};${B(15,p.text)}">
              <span style="color:${p.muted}">${k}</span><span
              style="font-family:${t.displayStack};font-weight:700">${v}</span></div>`).join("")}
          <div style="height:64px;border-radius:${R(10)}px;background:${alpha(p.accent,.2)};margin-top:16px"></div>
        </div></div></div>`);

  case "asym": return page(
    nav("FIELD", ["Work","Studio","Journal"], "Start a project") +
    `<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:${D(30)}px;
       padding:${D(56)}px ${D(48)}px;align-items:start">
      <div style="padding-top:${D(40)}px">
        <div style="${H(58)};max-width:92%">We build the parts people actually use.</div>
        <p style="${B(18)};margin:${D(24)}px 0 0;max-width:70%">
          A design and engineering studio in Muscat.</p></div>
      <div style="margin-top:-${D(24)}px">${img(360, 150, 55)}</div>
     </div>
     <div style="display:grid;grid-template-columns:1fr 2.2fr;gap:${D(30)}px;padding:0 ${D(48)}px ${D(46)}px">
       <div>${img(200, 95, 70)}</div>
       <div style="padding-top:${D(52)}px">
         <div style="${H(26)}">Selected work</div>
         ${[["Halcyon","Brand, 2026"],["Tideline","Product"],["Ferry Co.","Site and app"]].map(([n,m])=>
           `<div style="display:flex;justify-content:space-between;padding:${D(14)}px 0;
             border-top:${s.border}px solid ${p.line};${B(16,p.text)};margin-top:${D(10)}px">
             <span>${n}</span><span style="color:${p.muted}">${m}</span></div>`).join("")}</div>
     </div>` + foot("FIELD"));

  case "fullscreen": return page(
    `<div style="height:620px;background:linear-gradient(155deg,${p.accent},${p.accent2});
       position:relative;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;gap:26px;padding:${D(22)}px ${D(48)}px;
        color:${p.onAccent};font-family:${t.displayStack}">
        <span style="font-weight:${t.weight};font-size:19px">Halcyon</span>
        <span style="margin-left:auto;font-size:14px;opacity:.85">Features · Pricing · Log in</span></div>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
        text-align:center;padding:0 ${D(48)}px">
        <div style="font-family:${t.displayStack};font-weight:${t.weight};font-size:74px;line-height:1;
          letter-spacing:${t.tracking}em;color:${p.onAccent};max-width:840px">
          One app. Every device. No setup.</div>
        <p style="font-family:${t.bodyStack};font-size:19px;color:${alpha(p.onAccent,.85)};
          margin:${D(22)}px 0 ${D(30)}px;max-width:520px">Download it and you are already finished.</p>
        <span style="display:inline-block;background:${p.ground};color:${p.text};font-weight:700;
          font-family:${t.displayStack};font-size:16px;padding:16px 34px;border-radius:${R(16)}px">
          Download free</span></div></div>`);

  case "sidescroll": return page(
    nav("Aperture", ["Work","About","Contact"], "") +
    `<div style="padding:${D(40)}px ${D(48)}px ${D(18)}px;display:flex;align-items:baseline;gap:16px">
      <div style="${H(32)}">Recent work</div>
      <div style="${B(14)};margin-left:auto">Scroll sideways →</div></div>
     <div style="display:flex;gap:${D(18)}px;padding:0 0 ${D(40)}px ${D(48)}px;overflow:hidden">
      ${[["Tideline","Identity"],["Quarry","Packaging"],["Meridian","Motion"],["Aster","Web"]]
        .map(([n,m],i)=>`<div style="flex:none;width:330px">${img(300, 120+i*22, 62)}
        <div style="${H(19,700)};margin-top:12px">${esc(n)}</div>
        <div style="${B(14)}">${esc(m)}</div></div>`).join("")}
      <div style="flex:none;width:330px;opacity:.45">${img(300, 200, 62)}</div></div>
     <div style="padding:0 ${D(48)}px ${D(34)}px;display:flex;gap:6px">
      ${[0,1,2,3].map(i=>`<div style="height:3px;flex:${i===0?2:1};border-radius:2px;
        background:${i===0?p.accent:alpha(p.text,.14)}"></div>`).join("")}</div>` + foot("Aperture"));

  case "card": return page(
    nav("Northwind", ["Product","Pricing","Customers","Docs"], "Start free") +
    `<div style="padding:${D(48)}px ${D(48)}px ${D(28)}px;text-align:center">
      <div style="${H(40)};max-width:660px;margin:0 auto">Everything your team keeps losing</div>
      <p style="${B(17)};margin:${D(16)}px auto 0;max-width:520px">
        Nine tools' worth of work, in blocks you can rearrange.</p></div>
     <div style="padding:0 ${D(48)}px ${D(44)}px;display:grid;grid-template-columns:repeat(3,1fr);
       gap:${D(18)}px">
      ${[["Roadmap","Dates that move when the work moves.","01"],
         ["Inbox","Every request in one queue, triaged.","02"],
         ["Docs","Specs that live beside the tickets.","03"],
         ["Automations","If this, then that — without a script.","04"],
         ["Insights","Where the week actually went.","05"],
         ["Guests","Share a board without giving up a seat.","06"]]
        .map(([n,d2,num])=>`<div style="${card};padding:${D(24)}px">
        <div style="${B(12,p.accent)};font-family:${t.displayStack};font-weight:700;
          letter-spacing:.12em">${num}</div>
        <div style="${H(20,700)};margin:${D(12)}px 0 8px">${esc(n)}</div>
        <div style="${B(14)}">${esc(d2)}</div></div>`).join("")}</div>` + foot("Northwind"));

  case "magazine": return page(
    `<div style="text-align:center;padding:${D(26)}px ${D(48)}px ${D(14)}px">
      <div style="${H(40,700)};letter-spacing:.04em">THE GULF REVIEW</div></div>
     <div style="display:flex;gap:28px;justify-content:center;padding-bottom:${D(14)}px;
       border-bottom:2px solid ${p.text};margin:0 ${D(48)}px;${B(13,p.text)}">
       ${["Politics","Culture","Business","Science","Opinion"].map(n=>`<span>${n}</span>`).join("")}</div>
     <div style="display:grid;grid-template-columns:.8fr 1.5fr .8fr;gap:${D(28)}px;
       padding:${D(32)}px ${D(48)}px ${D(40)}px">
      <div>${[["Business","The port that ate a town"],["Science","Mapping the reef"],
              ["Culture","Why the old souq wins"]].map(([k,h2])=>
        `<div style="padding-bottom:${D(14)}px;margin-bottom:${D(14)}px;
          border-bottom:${s.border}px solid ${p.line}">
          <div style="${B(11,p.accent)};font-family:${t.displayStack};font-weight:700;
            letter-spacing:.12em">${k.toUpperCase()}</div>
          <div style="${H(17,600)};margin-top:6px">${h2}</div></div>`).join("")}</div>
      <div style="border-inline:${s.border}px solid ${p.line};padding-inline:${D(26)}px">
        ${img(230)}
        <div style="${H(34)};margin-top:${D(18)}px">The quiet reinvention of the Omani coastline</div>
        <p style="${B(16)};margin:${D(12)}px 0 10px">Forty years of construction has redrawn the shore
          from Muscat to Sur. What it cost, and who paid for it.</p>
        <div style="${B(13)}">By Amal Hassan · 18 min read</div></div>
      <div><div style="${H(14,700)};letter-spacing:.12em;margin-bottom:${D(14)}px">MOST READ</div>
        ${[1,2,3,4].map(i=>`<div style="display:flex;gap:11px;padding:${D(11)}px 0;
          border-top:${s.border}px solid ${p.line}">
          <span style="${H(18,800)};color:${p.accent}">${i}</span>
          <span style="${B(13,p.text)}">A headline running to about two lines</span></div>`).join("")}</div>
     </div>` + foot("The Gulf Review"));

  case "gallery": return page(
    `<div style="display:flex;align-items:baseline;gap:20px;padding:${D(34)}px ${D(40)}px ${D(22)}px">
      <span style="${H(22)}">L. Prem</span>
      <span style="${B(14)};margin-left:auto">Work · Info</span></div>
     <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:${D(10)}px;padding:0 ${D(40)}px">
      ${[290,210,250,220,285,205,260,235,275].map((h,i)=>img(h, 100+i*24, 48+i*4)).join("")}</div>
     <div style="${B(13)};padding:${D(26)}px ${D(40)}px">Selected work 2019—2026</div>`);

  case "zigzag": return page(
    nav("Tideline", ["Features","Pricing","Support"], "Try it free") +
    `<div style="padding:${D(44)}px ${D(48)}px ${D(20)}px;text-align:center">
      <div style="${H(38)};max-width:600px;margin:0 auto">Three things, done properly</div></div>` +
    [["Capture anything","A note, a photo, a voice memo — it lands in the same inbox and waits for you.",false],
     ["Find it later","Search reads your handwriting and your screenshots, not just your typing.",true],
     ["Share the bits","Send one item or a whole collection. The other person needs no account.",false]]
      .map(([h2,d2,flip])=>`<div style="display:grid;grid-template-columns:1fr 1fr;gap:${D(40)}px;
        align-items:center;padding:${D(28)}px ${D(48)}px">
        <div style="${flip?"order:2":""}">${img(220, flip?200:130, 60)}</div>
        <div style="${flip?"order:1":""}">
          <div style="${H(28)}">${h2}</div>
          <p style="${B(16)};margin:${D(14)}px 0 ${D(18)}px">${d2}</p>${ghost("Learn more")}</div>
      </div>`).join("") + foot("Tideline"));

  case "fpattern": return page(
    nav("Ledger Docs", ["Guides","Reference","API","Changelog"], "") +
    `<div style="display:grid;grid-template-columns:210px 1fr;gap:${D(34)}px;padding:${D(34)}px ${D(48)}px ${D(40)}px">
      <div>${["Getting started","Authentication","Reconciliation","Webhooks","Errors","Rate limits"]
        .map((n,i)=>`<div style="${B(14, i===2?p.accent:p.muted)};padding:${D(9)}px 0;
          ${i===2?`font-family:${t.displayStack};font-weight:700;`:""}">${n}</div>`).join("")}</div>
      <div style="max-width:660px">
        <div style="${H(40)}">Reconciliation</div>
        <p style="${B(17)};margin:${D(16)}px 0 ${D(26)}px">
          Ledger matches bank lines to entries overnight. This page covers how matching works,
          how to override it, and what happens when a line cannot be matched at all.</p>
        <div style="${H(22)};margin-bottom:${D(10)}px">How matching works</div>
        <p style="${B(16)};margin:0 0 ${D(22)}px">Each incoming line is compared on amount, date
          window and counterparty reference. Two of three constitutes a match.</p>
        <div style="${card};padding:${D(18)}px;font-family:ui-monospace,monospace;font-size:13px;
          color:${p.muted};margin-bottom:${D(22)}px">POST /v1/reconcile<br>&nbsp;&nbsp;{ "account": "acc_18f", "window": 3 }</div>
        <div style="${H(22)};margin-bottom:${D(10)}px">Overriding a match</div>
        <p style="${B(16)};margin:0">Any match can be broken from the ledger view. The original
          suggestion is kept on the audit trail.</p></div></div>` + foot("Ledger"));

  case "interactive": return page(
    nav("Atlas", ["Product","Models","Pricing"], "Open app") +
    `<div style="display:grid;grid-template-columns:1fr 1.25fr;gap:${D(30)}px;padding:${D(40)}px ${D(48)}px">
      <div><div style="${H(36)}">Ask it anything about your data.</div>
        <p style="${B(16)};margin:${D(16)}px 0 ${D(22)}px">Atlas reads your warehouse and answers
          in plain language. Every answer shows the query it ran.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${["Revenue by region","Churn last quarter","Top 10 accounts"].map((c,i)=>
            `<span style="border:${Math.max(1,s.border)}px solid ${i===0?p.accent:p.line};
              ${i===0?`background:${alpha(p.accent,.14)};color:${p.accent};`:`color:${p.muted};`}
              border-radius:999px;padding:8px 15px;${B(13)};font-family:${t.displayStack};
              font-weight:600">${c}</span>`).join("")}</div></div>
      <div style="${card};padding:${D(20)}px;display:flex;flex-direction:column;gap:${D(12)}px">
        <div style="align-self:flex-end;background:${p.accent};color:${p.onAccent};
          border-radius:${R(14)}px ${R(14)}px 4px ${R(14)}px;padding:11px 15px;${B(14)};max-width:70%">
          Which region grew fastest last quarter?</div>
        <div style="align-self:flex-start;background:${alpha(p.text,.07)};
          border-radius:${R(14)}px ${R(14)}px ${R(14)}px 4px;padding:13px 15px;${B(14,p.text)};max-width:82%">
          Gulf, up 34% on Q3. Oman contributed most of the rise.
          <div style="height:56px;border-radius:${R(8)}px;background:${alpha(p.accent,.22)};margin-top:11px"></div>
        </div>
        <div style="align-self:flex-start;${B(12)}">● ● ●</div>
        <div style="margin-top:auto;border:${Math.max(1,s.border)}px solid ${p.line};
          border-radius:${R(12)}px;padding:11px 14px;display:flex;align-items:center;${B(14)}">
          Ask a follow-up<span style="margin-left:auto;color:${p.accent};font-weight:700">↑</span></div>
      </div></div>` + foot("Atlas"));

  case "animated": return page(
    nav("Meridian", ["Work","Studio","Contact"], "") +
    `<div style="position:relative;height:460px;overflow:hidden;display:flex;align-items:center;
       padding:0 ${D(48)}px">
      <div style="position:absolute;width:300px;height:300px;border-radius:50%;filter:blur(60px);
        background:${p.accent};opacity:.5;left:52%;top:-60px"></div>
      <div style="position:absolute;width:230px;height:230px;border-radius:50%;filter:blur(56px);
        background:${p.accent2};opacity:.5;right:6%;bottom:-40px"></div>
      <div style="position:relative">
        <div style="${H(66)};max-width:640px">Motion is<br>the message.</div>
        <p style="${B(18)};margin:${D(20)}px 0 ${D(26)}px;max-width:420px">
          We make brands that arrive rather than simply appear.</p>
        ${btn("See it move", true)}
      </div>
      <div style="position:absolute;right:${D(48)}px;bottom:${D(30)}px;display:flex;gap:6px">
        ${[1,.6,.3].map(o=>`<div style="width:34px;height:3px;border-radius:2px;
          background:${p.accent};opacity:${o}"></div>`).join("")}</div>
     </div>` + foot("Meridian"));

  default: return page(nav("Studio", ["Work","About"], "Contact") +
    `<div style="padding:${D(60)}px ${D(48)}px"><div style="${H(40)}">Preview</div></div>` + foot("Studio"));
  }
}
