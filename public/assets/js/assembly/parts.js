/* ===========================================================================
   Live previews of the catalogue parts.

   Hover state is most of what separates one navigation bar from another, and
   it cannot be expressed with inline styles — so each preview ships a small
   scoped stylesheet keyed to a unique class. Put the cursor on "Services" and
   you see what that menu actually does.
   =========================================================================== */

import { alpha, mix, onColor } from "./color.js";
import { renderPage, PAGE_W } from "./sites.js";

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
let uid = 0;
const nextId = () => "p" + (++uid);

const LINKS = ["Home", "About", "Services", "Contact"];

/* ---- navigation ---------------------------------------------------------- */

export function renderMenu(v, p, t, s) {
  const k = nextId();
  const r = Math.min(s.radius, 18);
  const base = `
    .${k}{font-family:${t.displayStack};background:${p.ground};padding:22px;border-radius:10px}
    .${k} .bar{display:flex;align-items:center;gap:26px;padding:13px 18px;
      border-radius:${r}px;transition:all ${s.ms}ms ${"cubic-bezier(.22,1,.36,1)"}}
    .${k} .logo{font-weight:${t.weight};letter-spacing:${t.tracking}em;font-size:15px;color:${p.text}}
    .${k} .links{display:flex;align-items:center;gap:6px;margin-left:auto}
    .${k} a{position:relative;color:${p.muted};text-decoration:none;font-size:13px;font-weight:500;
      padding:7px 11px;border-radius:${Math.min(r,10)}px;cursor:pointer;
      transition:all ${s.ms}ms cubic-bezier(.22,1,.36,1)}
  `;

  const V = {
    glass: `
      .${k}{background:linear-gradient(${p.ground},${mix(p.ground,p.accent,.18)})}
      .${k} .bar{background:${alpha(p.surface,.55)};backdrop-filter:blur(14px) saturate(1.5);
        border:1px solid ${alpha(p.text,.12)};box-shadow:0 10px 34px ${alpha("#000",.3)}}
      .${k} a:hover{color:${p.text};background:${alpha(p.text,.10)};transform:translateY(-1px)}`,
    underline: `
      .${k} .bar{border-bottom:${Math.max(1,s.border)}px solid ${p.line}}
      .${k} a::after{content:"";position:absolute;left:11px;right:11px;bottom:2px;height:2px;
        background:${p.accent};transform:scaleX(0);transform-origin:left;
        transition:transform ${s.ms}ms cubic-bezier(.22,1,.36,1)}
      .${k} a:hover{color:${p.text}}
      .${k} a:hover::after{transform:scaleX(1)}`,
    tint: `
      .${k} .bar{border-bottom:${Math.max(1,s.border)}px solid ${p.line}}
      .${k} a:hover{color:${p.accent}}`,
    pill: `
      .${k} .bar{border-bottom:${Math.max(1,s.border)}px solid ${p.line}}
      .${k} a:hover{color:${p.onAccent};background:${p.accent}}`,
    invert: `
      .${k} .bar{border:1px solid ${p.line}}
      .${k} .bar:hover{background:${p.accent}}
      .${k} .bar:hover .logo{color:${p.onAccent}}
      .${k} .bar:hover a{color:${alpha(p.onAccent,.8)}}
      .${k} .bar:hover a:hover{color:${p.onAccent}}`,
    outline: `
      .${k} a{border:1px solid transparent}
      .${k} a:hover{border-color:${p.accent};color:${p.text}}`,
    split: `
      .${k} .bar{justify-content:center;gap:18px}
      .${k} .links{margin:0}
      .${k} .logo{order:2;margin:0 14px}
      .${k} .l-a{order:1}.${k} .l-b{order:3}
      .${k} a:hover{color:${p.accent}}`,
    rail: `
      .${k} .bar{flex-direction:column;align-items:flex-start;gap:4px;width:150px;
        background:${p.surface};border:1px solid ${p.line};padding:16px 12px}
      .${k} .links{flex-direction:column;align-items:stretch;margin:14px 0 0;width:100%}
      .${k} a{padding:8px 10px}
      .${k} a:hover{background:${alpha(p.accent,.16)};color:${p.accent}}`,
    burger: `
      .${k} .bar{border-bottom:${Math.max(1,s.border)}px solid ${p.line}}
      .${k} .links{display:none}
      .${k} .burg{margin-left:auto;display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:6px}
      .${k} .burg i{width:20px;height:2px;background:${p.text};display:block;
        transition:all ${s.ms}ms cubic-bezier(.22,1,.36,1)}
      .${k} .burg:hover i{background:${p.accent}}
      .${k} .burg:hover i:nth-child(2){width:12px}`,
    cta: `
      .${k} .bar{border-bottom:${Math.max(1,s.border)}px solid ${p.line}}
      .${k} a:hover{color:${p.text}}
      .${k} .btn{background:${p.accent};color:${p.onAccent};font-weight:700;
        padding:8px 15px;border-radius:${Math.min(r,14)}px;margin-left:8px}
      .${k} .btn:hover{background:${mix(p.accent,p.text,.2)};color:${p.onAccent}}`,
    tracked: `
      .${k} .bar{border-bottom:${Math.max(1,s.border)}px solid ${p.line}}
      .${k} a{text-transform:uppercase;letter-spacing:.14em;font-size:10.5px;opacity:.65}
      .${k} a:hover{opacity:1;color:${p.accent}}`,
    masthead: `
      .${k} .bar{flex-direction:column;gap:12px;border-bottom:2px solid ${p.text};padding-bottom:10px}
      .${k} .logo{font-family:${t.bodyStack};font-size:26px;letter-spacing:-.01em}
      .${k} .links{margin:0;gap:2px}
      .${k} a{font-size:11.5px;text-transform:uppercase;letter-spacing:.1em}
      .${k} a:hover{color:${p.accent};text-decoration:underline;text-underline-offset:4px}`,
    float: `
      .${k}{padding:34px 22px}
      .${k} .bar{background:${p.surface};border:1px solid ${p.line};border-radius:999px;
        box-shadow:0 14px 40px ${alpha("#000",.35)};padding:10px 14px 10px 20px}
      .${k} a{border-radius:999px}
      .${k} a:hover{background:${p.accent};color:${p.onAccent}}`,
    mega: `
      .${k}{padding-bottom:96px}
      .${k} .bar{border-bottom:${Math.max(1,s.border)}px solid ${p.line};position:relative}
      .${k} a:hover{color:${p.accent}}
      .${k} .has-mega .panel{position:absolute;left:0;right:0;top:100%;margin-top:8px;
        background:${p.surface};border:1px solid ${p.line};border-radius:${r}px;padding:14px;
        display:grid;grid-template-columns:repeat(3,1fr);gap:10px;
        opacity:0;visibility:hidden;transform:translateY(-6px);
        transition:all ${s.ms}ms cubic-bezier(.22,1,.36,1);box-shadow:0 20px 50px ${alpha("#000",.4)}}
      .${k} .has-mega:hover .panel{opacity:1;visibility:visible;transform:none}
      .${k} .panel div{font-size:11px;color:${p.muted};padding:9px;border-radius:6px;
        background:${alpha(p.text,.04)}}`,
  };

  const links = (cls = "") => LINKS.map(l => `<a class="${cls}">${l}</a>`).join("");
  let inner;
  if (v.id === "split") {
    inner = `<span class="l-a">${LINKS.slice(0,2).map(l=>`<a>${l}</a>`).join("")}</span>
             <span class="logo">Studio</span>
             <span class="l-b">${LINKS.slice(2).map(l=>`<a>${l}</a>`).join("")}</span>`;
  } else if (v.id === "burger") {
    inner = `<span class="logo">Studio</span><span class="burg"><i></i><i></i><i></i></span>`;
  } else if (v.id === "cta") {
    inner = `<span class="logo">Studio</span><span class="links">${links()}<a class="btn">Get in touch</a></span>`;
  } else if (v.id === "mega") {
    inner = `<span class="logo">Studio</span><span class="links">
      <a>Home</a><a>About</a>
      <span class="has-mega"><a>Services</a>
        <span class="panel"><div>Brand</div><div>Web</div><div>Motion</div>
        <div>Strategy</div><div>Content</div><div>Support</div></span></span>
      <a>Contact</a></span>`;
  } else {
    inner = `<span class="logo">Studio</span><span class="links">${links()}</span>`;
  }

  return { css: base + (V[v.id] || ""), html: `<div class="${k}"><div class="bar">${inner}</div></div>` };
}

/* ---- buttons ------------------------------------------------------------- */

export function renderButton(v, p, t, s) {
  const k = nextId();
  const r = s.radius;
  const base = `
    .${k}{font-family:${t.displayStack};background:${p.ground};padding:40px;border-radius:10px;
      display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap}
    .${k} .b{cursor:pointer;font-weight:700;font-size:14px;border:0;font-family:inherit;
      padding:13px 24px;border-radius:${r}px;position:relative;display:inline-flex;
      align-items:center;gap:9px;text-decoration:none;
      transition:all ${s.ms}ms cubic-bezier(.22,1,.36,1)}
  `;
  const V = {
    solid:`.${k} .b{background:${p.accent};color:${p.onAccent}}
           .${k} .b:hover{background:${mix(p.accent,"#000",.22)}}`,
    outline:`.${k} .b{background:transparent;color:${p.accent};box-shadow:inset 0 0 0 ${Math.max(1,s.border)}px ${p.accent}}
             .${k} .b:hover{background:${p.accent};color:${p.onAccent}}`,
    ghost:`.${k} .b{background:transparent;color:${p.text}}
           .${k} .b:hover{background:${alpha(p.text,.10)}}`,
    pill:`.${k} .b{background:${p.accent};color:${p.onAccent};border-radius:999px;padding:13px 28px}
          .${k} .b:hover{background:${mix(p.accent,"#000",.22)}}`,
    square:`.${k} .b{background:${p.text};color:${p.ground};border-radius:0;text-transform:uppercase;
              letter-spacing:.1em;font-size:12px}
            .${k} .b:hover{background:${p.accent};color:${p.onAccent}}`,
    arrow:`.${k} .b{background:${p.accent};color:${p.onAccent}}
           .${k} .b i{font-style:normal;transition:transform ${s.ms}ms cubic-bezier(.22,1,.36,1)}
           .${k} .b:hover i{transform:translateX(5px)}`,
    lift:`.${k} .b{background:${p.surface};color:${p.text};box-shadow:0 2px 0 ${p.line}}
          .${k} .b:hover{transform:translateY(-3px);box-shadow:0 12px 26px ${alpha("#000",.4)};color:${p.accent}}`,
    underline:`.${k} .b{background:none;color:${p.text};padding:8px 2px;border-radius:0}
      .${k} .b::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:${p.accent};
        transform:scaleX(0);transform-origin:left;transition:transform ${s.ms}ms cubic-bezier(.22,1,.36,1)}
      .${k} .b:hover::after{transform:scaleX(1)}`,
    shadowbox:`.${k} .b{background:${p.accent};color:${p.onAccent};box-shadow:4px 4px 0 ${p.text}}
      .${k} .b:hover{transform:translate(4px,4px);box-shadow:0 0 0 ${p.text}}`,
    gradient:`.${k} .b{background:linear-gradient(110deg,${p.accent},${p.accent2});color:${p.onAccent};
        background-size:180% 100%}
      .${k} .b:hover{background-position:100% 0}`,
    icon:`.${k} .b{background:${p.surface};color:${p.text};padding-left:8px}
      .${k} .b span{width:28px;height:28px;border-radius:50%;background:${alpha(p.accent,.2)};
        color:${p.accent};display:grid;place-items:center;font-size:13px;
        transition:all ${s.ms}ms cubic-bezier(.22,1,.36,1)}
      .${k} .b:hover span{background:${p.accent};color:${p.onAccent}}`,
    glow:`.${k} .b{background:${p.accent};color:${p.onAccent};box-shadow:0 0 0 ${alpha(p.accent,.5)}}
      .${k} .b:hover{box-shadow:0 0 26px ${alpha(p.accent,.75)}}`,
  };
  const label = v.id === "arrow" ? `Get started<i>&#8594;</i>`
              : v.id === "icon"  ? `<span>&#9654;</span>Watch the demo`
              : "Get started";
  return { css: base + (V[v.id] || ""),
           html: `<div class="${k}"><a class="b">${label}</a><a class="b">Learn more</a></div>` };
}

/* ---- heroes -------------------------------------------------------------- */

export function renderHero(v, p, t, s) {
  const k = nextId();
  const r = s.radius;
  const head = (size) => `font-family:${t.displayStack};font-weight:${t.weight};
    letter-spacing:${t.tracking}em;${t.caps ? "text-transform:uppercase;" : ""}
    font-size:${size}px;line-height:1.04;color:${p.text}`;
  const btn = `display:inline-block;background:${p.accent};color:${p.onAccent};font-weight:700;
    font-size:12px;padding:10px 18px;border-radius:${Math.min(r,16)}px;font-family:${t.displayStack}`;
  const body = `font-family:${t.bodyStack};color:${p.muted};font-size:12.5px;line-height:1.6`;
  const wrap = (inner, extra = "") =>
    `<div class="${k}" style="background:${p.ground};border-radius:10px;overflow:hidden;${extra}">${inner}</div>`;

  const art = (h) => `<div style="background:linear-gradient(140deg,${p.accent},${p.accent2});
    border-radius:${Math.min(r,14)}px;height:${h}px"></div>`;

  switch (v.id) {
    case "split": return { css:"", html: wrap(
      `<div style="display:grid;grid-template-columns:1.1fr .9fr;gap:26px;align-items:center;padding:34px">
        <div><div style="${head(34)}">Build something worth visiting</div>
        <p style="${body};margin:12px 0 18px">A short paragraph carrying the promise.</p>
        <span style="${btn}">Get started</span></div>${art(168)}</div>`) };
    case "overlay": return { css:"", html: wrap(
      `<div style="position:relative;height:250px;background:linear-gradient(140deg,${p.accent},${p.accent2})">
        <div style="position:absolute;inset:0;background:linear-gradient(transparent,${alpha(p.ground,.85)})"></div>
        <div style="position:absolute;left:32px;right:32px;bottom:28px">
          <div style="${head(32)}">Build something worth visiting</div>
          <span style="${btn};margin-top:14px">Get started</span></div></div>`) };
    case "stack": return { css:"", html: wrap(
      `<div style="padding:46px 34px"><div style="${head(38)};max-width:74%">Build something worth visiting</div>
       <p style="${body};margin:14px 0 20px;max-width:52%">A short paragraph carrying the promise.</p>
       <span style="${btn}">Get started</span></div>`) };
    case "card": return { css:"", html: wrap(
      `<div style="background:${p.accent};padding:34px;display:grid;place-items:center">
        <div style="background:${p.surface};border-radius:${Math.min(r,16)}px;padding:30px;max-width:78%;
          box-shadow:0 22px 50px ${alpha("#000",.35)}">
          <div style="${head(28)}">Build something worth visiting</div>
          <p style="${body};margin:11px 0 16px">A short paragraph carrying the promise.</p>
          <span style="${btn}">Get started</span></div></div>`) };
    case "bigtype": return { css:"", html: wrap(
      `<div style="padding:40px 26px">
        <div style="${head(60)};letter-spacing:-.05em">BUILD<br>SOMETHING</div>
        <div style="display:flex;justify-content:space-between;align-items:end;margin-top:18px">
          <p style="${body};max-width:46%">A short paragraph carrying the promise.</p>
          <span style="${btn}">Get started</span></div></div>`) };
    case "minimal": return { css:"", html: wrap(
      `<div style="padding:84px 34px;text-align:center">
        <div style="${head(26)}">Build something worth visiting</div>
        <p style="${body};margin:16px auto 0;max-width:60%">One line, and a great deal of space.</p></div>`) };
    case "canvas": return { css:`
      .${k} .orb{position:absolute;border-radius:50%;filter:blur(26px);opacity:.75;
        animation:float${k} 9s ease-in-out infinite}
      @keyframes float${k}{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(24px,-18px) scale(1.18)}}`,
      html: wrap(
      `<div style="position:relative;height:250px;display:grid;place-items:center;overflow:hidden">
        <div class="orb" style="width:150px;height:150px;background:${p.accent};left:12%;top:14%"></div>
        <div class="orb" style="width:120px;height:120px;background:${p.accent2};right:14%;bottom:10%;animation-delay:-4s"></div>
        <div style="position:relative;text-align:center;padding:0 26px">
          <div style="${head(32)}">Build something worth visiting</div>
          <span style="${btn};margin-top:16px">Get started</span></div></div>`) };
    default: return { css:"", html: wrap(
      `<div style="padding:56px 34px;text-align:center">
        <div style="${head(34)};max-width:80%;margin:0 auto">Build something worth visiting</div>
        <p style="${body};margin:14px auto 20px;max-width:58%">A short paragraph carrying the promise.</p>
        <span style="${btn}">Get started</span></div>`) };
  }
}

/* ---- site types and sections --------------------------------------------- */

/* A wireframe of the page itself. Twelve layouts built from a handful of
   blocks, so a storefront reads as a storefront and an editorial site reads as
   an editorial site before a word is read. */
function wireBlocks(spec, p, s) {
  const r  = Math.min(s.radius, 8);
  const ln = (w, h = 5, o = 1) =>
    `<div style="height:${h}px;width:${w};border-radius:2px;background:${p.text};opacity:${o}"></div>`;
  const box = (h, fill) =>
    `<div style="height:${h}px;border-radius:${r}px;background:${fill || alpha(p.text, .09)}"></div>`;
  const cols = (n, h, fill) =>
    `<div style="display:grid;grid-template-columns:repeat(${n},1fr);gap:6px">
       ${Array.from({length:n}, () => box(h, fill)).join("")}</div>`;

  const [kind, arg] = spec.split(":");
  switch (kind) {
    case "nav": return `<div style="display:flex;align-items:center;gap:7px;padding-bottom:9px;
        border-bottom:1px solid ${alpha(p.text,.14)}">
        ${ln("34px",6)}<div style="margin-left:auto;display:flex;gap:6px">
        ${ln("20px",4,.45)}${ln("20px",4,.45)}${ln("20px",4,.45)}</div>
        <div style="width:30px;height:12px;border-radius:${Math.min(r,6)}px;background:${p.accent}"></div></div>`;
    case "masthead": return `<div style="text-align:center;padding-bottom:9px;
        border-bottom:2px solid ${p.text}">${ln("120px",11)}
        <div style="display:flex;gap:9px;justify-content:center;margin-top:7px">
        ${ln("24px",3,.45)}${ln("24px",3,.45)}${ln("24px",3,.45)}${ln("24px",3,.45)}</div></div>`;
    case "narrow": return `<div style="display:flex;gap:8px;align-items:center">
        <div style="width:26px;height:26px;border-radius:50%;background:${p.accent}"></div>${ln("70px",7)}</div>`;
    case "hero": return `<div style="padding:14px 0">${ln("78%",13)}
        <div style="margin-top:7px">${ln("54%",5,.4)}</div>
        <div style="width:56px;height:16px;border-radius:${Math.min(r,8)}px;background:${p.accent};margin-top:10px"></div></div>`;
    case "bigtype": return `<div style="padding:12px 0">${ln("100%",20)}<div style="margin-top:5px">${ln("62%",20)}</div></div>`;
    case "heroimg": return `<div style="height:62px;border-radius:${r}px;
        background:linear-gradient(130deg,${p.accent},${p.accent2});position:relative">
        <div style="position:absolute;left:10px;bottom:10px;width:46%">${ln("100%",8,.9)}</div></div>`;
    case "herodate": return `<div style="display:flex;gap:10px;align-items:center;padding:12px 0">
        <div style="width:46px;height:46px;border-radius:${r}px;background:${p.accent};flex:none"></div>
        <div style="flex:1">${ln("80%",11)}<div style="margin-top:6px">${ln("46%",4,.4)}</div></div></div>`;
    case "text": return `<div style="padding:10px 0">${[92,86,94,60].map(w=>
        `<div style="margin-bottom:5px">${ln(w+"%",4,.35)}</div>`).join("")}</div>`;
    case "lead": return `<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:8px;padding:10px 0">
        <div>${box(54)}<div style="margin-top:6px">${ln("86%",6)}</div></div>
        <div>${[0,1,2].map(()=>`<div style="margin-bottom:6px">${ln("100%",4,.3)}</div>`).join("")}</div></div>`;
    case "cols": return `<div style="padding:10px 0">${cols(+arg, 40)}</div>`;
    case "grid": {
      const [rw, cl] = arg.split("x").map(Number);
      return `<div style="display:grid;grid-template-columns:repeat(${cl},1fr);gap:6px;padding:10px 0">
        ${Array.from({length:rw*cl},(_,i)=>box(i%2?30:38, i===0?alpha(p.accent,.4):null)).join("")}</div>`;
    }
    case "railgrid": {
      const [rw, cl] = arg.split("x").map(Number);
      return `<div style="display:grid;grid-template-columns:52px 1fr;gap:8px;padding:10px 0">
        <div>${[0,1,2,3].map(()=>`<div style="margin-bottom:5px">${ln("100%",7,.18)}</div>`).join("")}</div>
        <div style="display:grid;grid-template-columns:repeat(${cl},1fr);gap:6px">
        ${Array.from({length:rw*cl},()=>box(28)).join("")}</div></div>`;
    }
    case "list": return `<div style="padding:8px 0">${Array.from({length:+arg},()=>
        `<div style="display:flex;gap:8px;align-items:center;padding:6px 0;
          border-top:1px solid ${alpha(p.text,.09)}">
          <div style="width:34px;height:24px;border-radius:${Math.min(r,5)}px;background:${alpha(p.text,.12)};flex:none"></div>
          <div style="flex:1">${ln("70%",5)}<div style="margin-top:4px">${ln("40%",3,.32)}</div></div></div>`).join("")}</div>`;
    case "stats": return `<div style="display:grid;grid-template-columns:repeat(${arg},1fr);gap:8px;padding:12px 0">
        ${Array.from({length:+arg},()=>`<div>${ln("58%",14,1)}<div style="margin-top:5px">${ln("80%",3,.3)}</div></div>`).join("")}</div>`;
    case "price": return `<div style="display:grid;grid-template-columns:repeat(${arg},1fr);gap:6px;padding:10px 0">
        ${Array.from({length:+arg},(_,i)=>`<div style="height:52px;border-radius:${r}px;
          border:${i===1?2:1}px solid ${i===1?p.accent:alpha(p.text,.14)};
          background:${i===1?alpha(p.accent,.10):"transparent"}"></div>`).join("")}</div>`;
    case "menu": return `<div style="display:grid;grid-template-columns:repeat(${arg},1fr);gap:14px;padding:10px 0">
        ${Array.from({length:+arg},()=>`<div>${[0,1,2].map(()=>
          `<div style="display:flex;gap:8px;margin-bottom:6px">${ln("60%",4)}
           <div style="margin-left:auto">${ln("16px",4,.45)}</div></div>`).join("")}</div>`).join("")}</div>`;
    case "sched": return `<div style="padding:8px 0">${Array.from({length:+arg},()=>
        `<div style="display:flex;gap:9px;padding:5px 0;border-top:1px solid ${alpha(p.text,.09)}">
          ${ln("26px",4,.5)}<div style="flex:1">${ln("64%",4)}</div></div>`).join("")}</div>`;
    case "faces": return `<div style="display:flex;gap:8px;padding:10px 0">${Array.from({length:+arg},()=>
        `<div style="flex:1;text-align:center"><div style="width:100%;padding-top:100%;border-radius:50%;
          background:${alpha(p.text,.12)}"></div></div>`).join("")}</div>`;
    case "news": return `<div style="height:26px;border-radius:${r}px;background:${p.accent};
        display:flex;align-items:center;padding:0 9px;margin:10px 0">${ln("52%",4,.85)}</div>`;
    case "cal": return `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;padding:10px 0">
        ${Array.from({length:21},(_,i)=>`<div style="padding-top:100%;border-radius:2px;
          background:${i===9||i===16?p.accent:alpha(p.text,.10)}"></div>`).join("")}</div>`;
    case "svc": return `<div style="padding:8px 0">${Array.from({length:+arg},()=>
        `<div style="display:flex;align-items:center;gap:9px;padding:6px 0;
          border-top:1px solid ${alpha(p.text,.09)}">${ln("46%",5)}
          <div style="margin-left:auto;width:38px;height:14px;border-radius:${Math.min(r,7)}px;
            background:${alpha(p.accent,.5)}"></div></div>`).join("")}</div>`;
    case "donate": return `<div style="border:1px dashed ${p.accent};border-radius:${r}px;padding:12px;margin:10px 0;
        display:flex;align-items:center;gap:9px">${ln("40%",6)}
        <div style="margin-left:auto;width:52px;height:18px;border-radius:${Math.min(r,9)}px;background:${p.accent}"></div></div>`;
    case "logos": return `<div style="display:flex;gap:10px;padding:14px 0;opacity:.4">
        ${Array.from({length:5},()=>`<div style="flex:1;height:13px;border-radius:3px;background:${p.text}"></div>`).join("")}</div>`;
    case "hours": return `<div style="display:flex;gap:8px;padding:10px 0">
        <div style="flex:1">${[0,1].map(()=>`<div style="margin-bottom:5px">${ln("74%",4,.35)}</div>`).join("")}</div>
        <div style="width:62px;height:34px;border-radius:${r}px;background:${alpha(p.text,.12)}"></div></div>`;
    case "band": return `<div style="height:22px;border-radius:${r}px;background:${alpha(p.accent,.28)};margin:10px 0"></div>`;
    case "foot": return `<div style="display:flex;gap:8px;padding-top:9px;margin-top:4px;
        border-top:1px solid ${alpha(p.text,.14)};opacity:.35">
        ${ln("40px",4)}<div style="margin-left:auto">${ln("54px",4)}</div></div>`;
    default: return "";
  }
}

/* The whole stage, filled by an actual page. It is rendered at its real width
   and scaled down, so every proportion — type against gutter, image against
   column — stays honest. app.js sets the scale once it can measure the box. */
/* The whole stage, filled by an actual page in that layout. Rendered at real
   width and scaled down by app.js, so proportions stay honest. */
export function renderSiteType(layout, p, t, s) {
  return { css:"", html:
    `<div class="pagefit"><div class="pagescale" style="width:${PAGE_W}px">
       ${renderPage(layout.id, p, t, s)}
     </div></div>` };
}

let SECTION_NAMES_REF = {};
export function primeSectionNames(names) { SECTION_NAMES_REF = names; }
const SECTION_LABEL = (id) => SECTION_NAMES_REF[id] || id;

export function renderSection(id, p, t, s) {
  const k = nextId();
  const name = SECTION_LABEL(id);
  return { css:"", html: `
    <div class="${k}" style="background:${p.ground};border-radius:10px;padding:34px;display:flex;
      align-items:center;gap:18px;justify-content:center">
      <div style="width:52px;height:52px;border-radius:${Math.min(s.radius,14)}px;background:${p.accent};
        color:${p.onAccent};display:grid;place-items:center;font-weight:800;font-size:21px;
        font-family:${t.displayStack};flex:none">${esc(name[0])}</div>
      <div><div style="font-family:${t.displayStack};font-weight:${t.weight};font-size:19px;
        color:${p.text}">${esc(name)}</div>
        <div style="font-family:${t.bodyStack};color:${p.muted};font-size:13px;margin-top:4px">
        Include this on the site</div></div>
    </div>` };
}
