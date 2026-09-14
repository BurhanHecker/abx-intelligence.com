/* ===========================================================================
   What a website is made of.

   The client picks a TYPE first, because a restaurant and a SaaS product do
   not have the same parts — one needs a menu and a reservation form, the
   other needs pricing tiers and a changelog. Everything after that is filtered
   by the type they chose, so nobody is ever asked about a shopping cart for a
   CV site.
   =========================================================================== */

/* ---- 1. the twelve layouts ----------------------------------------------
   Taken from Figma's "12 website layout ideas". Each carries what it looks
   like and three or four kinds of site it is usually reached for, because
   "asymmetrical" means nothing to a client until you say what it is good at.
   Source: figma.com/resource-library/website-layout-ideas
   ------------------------------------------------------------------------- */
export const LAYOUTS = [
  { id:"grid",       name:"Grid",          n:1,
    look:"Rows and columns. Everything lines up, nothing shouts.",
    uses:["E-commerce catalogues","Blog archives","Photo libraries","Dashboards"] },
  { id:"split",      name:"Split screen",  n:2,
    look:"The page halved — words one side, the thing itself on the other.",
    uses:["Sign-up and registration","Product pages","AI chat interfaces","Comparison pages"] },
  { id:"asym",       name:"Asymmetrical",  n:3,
    look:"Deliberately off balance. Weight on one side, air on the other.",
    uses:["Fashion and brand sites","Creative studios","Editorial features"] },
  { id:"fullscreen", name:"Full screen",   n:4,
    look:"One image or one sentence, edge to edge, and almost nothing else.",
    uses:["Marketing and sales landing pages","App download pages","Single-product launches"] },
  { id:"sidescroll", name:"Side-scrolling",n:5,
    look:"Content runs sideways off the edge instead of down the page.",
    uses:["Portfolio reels","Category browsing","Case-study carousels"] },
  { id:"card",       name:"Cards",         n:6,
    look:"Self-contained blocks that reflow — the workhorse of the modern web.",
    uses:["SaaS feature pages","Marketplaces and listings","News feeds","AI tool directories"] },
  { id:"magazine",   name:"Magazine",      n:7,
    look:"A masthead, a lead story, and columns of everything else.",
    uses:["News sites","Long-form publications","Research journals"] },
  { id:"gallery",    name:"Gallery",       n:8,
    look:"Pictures do the talking. Type gets out of the way.",
    uses:["Photography portfolios","Architecture studios","Product lookbooks"] },
  { id:"zigzag",     name:"Zig-zag",       n:9,
    look:"Image left, text right, then swap. Down the whole page.",
    uses:["Feature walkthroughs","Onboarding pages","Marketing and sales"] },
  { id:"fpattern",   name:"F-pattern",     n:10,
    look:"Built around how people actually read — heavy left, stepping down.",
    uses:["Documentation","Long-form sales pages","Knowledge bases"] },
  { id:"interactive",name:"Interactive",   n:11,
    look:"The page responds. Things move when you touch them.",
    uses:["AI chatbots and assistants","Configurators","Educational tools","Games"] },
  { id:"animated",   name:"Animated",      n:12,
    look:"Motion carries the story — things arrive rather than appear.",
    uses:["Brand homepages","Agency sites","Product reveals"] },
];

/* The sections on offer no longer depend on the layout — a grid and a zig-zag
   can both carry a pricing table — so this is one list for everyone. */
export const SECTIONS = [
  "hero","features","stats","testimonial","pricing","faq","cta","contact",
  "work-grid","services","team","logos","gallery","lightbox","about",
  "product-grid","filters","cart","reviews","newsletter",
  "article-index","search","booking","calendar","news-band","map","chat","login",
];

/* Human names for the section ids above, so the feed can label them. */
export const SECTION_NAMES = {
  hero:"Hero", features:"Feature blocks", stats:"Statistics", testimonial:"Testimonials",
  pricing:"Pricing table", faq:"FAQ", cta:"Call to action", contact:"Contact form",
  "work-grid":"Work grid", "case-study":"Case study page", services:"Services list",
  team:"Team", logos:"Client logos", lightbox:"Image lightbox", about:"About", cv:"CV or résumé",
  "product-grid":"Product grid", filters:"Filter and sort", "product-page":"Product page",
  cart:"Basket and checkout", reviews:"Reviews", newsletter:"Newsletter sign-up",
  "article-index":"Article index", article:"Article page", categories:"Categories",
  author:"Author pages", search:"Search", ads:"Ad slots",
  integrations:"Integrations", docs:"Documentation", changelog:"Changelog", login:"Accounts",
  "menu-card":"Food menu", gallery:"Photo gallery", reservation:"Reservations",
  hours:"Opening hours", location:"Map and directions",
  countdown:"Countdown", schedule:"Programme", speakers:"Speakers", tickets:"Ticketing",
  venue:"Venue", sponsors:"Sponsors",
  "news-band":"Sliding news banner", calendar:"Calendar", staff:"Staff directory",
  admissions:"Admissions", documents:"Document library",
  "impact-stats":"Impact numbers", story:"Story", donate:"Donations", volunteer:"Volunteering",
  partners:"Partners", writing:"Writing", links:"Links", booking:"Booking calendar",
};

/* ---- 2. navigation styles ------------------------------------------------
   Every one of these is drawn live and is genuinely hoverable, because how a
   menu behaves under the cursor is most of what makes it feel expensive or
   cheap. `hover` names the behaviour the preview demonstrates. */
export const MENUS = [
  { id:"glass",      name:"Glass bar",          hover:"Item lifts, bar stays frosted",
    note:"Blurred and translucent over the page, like the one on abx-intelligence.com" },
  { id:"underline",  name:"Underline on hover", hover:"A rule draws under the word" },
  { id:"tint",       name:"Accent on hover",    hover:"Only the hovered word takes the accent" },
  { id:"pill",       name:"Sliding pill",       hover:"A filled pill moves behind the word" },
  { id:"invert",     name:"Whole bar inverts",  hover:"The entire bar flips to the accent" },
  { id:"outline",    name:"Outlined bar",       hover:"A hairline box draws around the word" },
  { id:"split",      name:"Centred logo",       hover:"Links either side, logo in the middle" },
  { id:"rail",       name:"Left rail",          hover:"Vertical, always on screen" },
  { id:"burger",     name:"Hamburger only",     hover:"Everything behind one button" },
  { id:"cta",        name:"Bar with a button",  hover:"Links plus one solid action" },
  { id:"tracked",    name:"Tracked capitals",   hover:"Letter-spaced caps, fades in" },
  { id:"masthead",   name:"Editorial masthead", hover:"Serif title over a rule of links" },
  { id:"float",      name:"Floating island",    hover:"A detached rounded bar, shadowed" },
  { id:"mega",       name:"Mega dropdown",      hover:"A full panel drops under the word" },
];

/* ---- 3. button styles ---------------------------------------------------- */
export const BUTTONS = [
  { id:"solid",    name:"Solid",            hover:"Darkens" },
  { id:"outline",  name:"Outlined",         hover:"Fills in" },
  { id:"ghost",    name:"Ghost",            hover:"Faint background appears" },
  { id:"pill",     name:"Pill",             hover:"Darkens" },
  { id:"square",   name:"Hard square",      hover:"Inverts" },
  { id:"arrow",    name:"With an arrow",    hover:"Arrow slides right" },
  { id:"lift",     name:"Lifts on hover",   hover:"Rises with a shadow" },
  { id:"underline",name:"Text and rule",    hover:"Rule sweeps across" },
  { id:"shadowbox",name:"Offset block",     hover:"Presses into its shadow" },
  { id:"gradient", name:"Two-tone",         hover:"Gradient shifts" },
  { id:"icon",     name:"Icon and label",   hover:"Icon circle fills" },
  { id:"glow",     name:"Glow",             hover:"Halo brightens" },
];

/* ---- 4. hero styles ------------------------------------------------------ */
export const HEROES = [
  { id:"center",   name:"Centred statement", note:"One headline, one action" },
  { id:"split",    name:"Split",             note:"Words one side, image the other" },
  { id:"overlay",  name:"Image with overlay",note:"Type sits on the picture" },
  { id:"stack",    name:"Stacked left",      note:"Everything ranged left, wide margin" },
  { id:"card",     name:"Card on colour",    note:"A panel floating on a flat field" },
  { id:"bigtype",  name:"Oversized type",    note:"Headline runs edge to edge" },
  { id:"minimal",  name:"Almost nothing",    note:"A line of text and a lot of space" },
  { id:"canvas",   name:"Animated ground",   note:"Moving shapes behind the words" },
];

/* The order the client is walked through. Colour, type and shape come from the
   generator and are unlimited; the rest are catalogues. */
export const COLOUR_BASES = [
  { id:"light",   name:"Light background",  note:"Dark text on near-white. The safe, readable default." },
  { id:"dark",    name:"Dark background",   note:"Light text on near-black. Looks expensive, harder to get right." },
  { id:"neutral", name:"Neutral and earthy",note:"Beige, clay, sage, stone — quiet colour, low saturation." },
  { id:"manual",  name:"I'll pick my own",  note:"Enter four colours yourself. We check them for readability." },
];

export const STEPS = [
  { id:"site",    label:"Layout",  title:"How should it be laid out?",     kind:"catalogue" },
  { id:"base",    label:"Base",    title:"Where should the colour start?", kind:"catalogue" },
  { id:"palette", label:"Colour",  title:"Colour",                         kind:"generated" },
  { id:"type",    label:"Fonts",   title:"Type",                           kind:"generated" },
  { id:"shape",   label:"Shape",   title:"Shape and feel",                 kind:"generated" },
  { id:"menupos", label:"Nav spot",title:"Where should the menu sit?",     kind:"catalogue" },
  { id:"menu",    label:"Menu",    title:"Navigation",                     kind:"generated" },
  { id:"button",  label:"Buttons", title:"Buttons",                        kind:"generated" },
  { id:"hero",    label:"Hero",    title:"The top of the page",            kind:"generated" },
  { id:"sections",label:"Sections",title:"What goes on the site",          kind:"multi" },
  { id:"review",  label:"Review",  title:"Your brief",                     kind:"review" },
];
