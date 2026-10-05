/**
 * Builds a client's whole website from their JSON file (clients/<id>.json).
 * Nothing here is specific to one business: names, colours, wording,
 * contact details and prices all come from the client file.
 */

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---- colour helpers (so one brand colour themes the whole page) ----
function validHex(h, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(h || "") ? h : fallback;
}
function mix(hex, other, t) {
  const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(other.slice(i, i + 2), 16));
  return "#" + a.map((v, i) => Math.round(v * (1 - t) + b[i] * t).toString(16).padStart(2, "0")).join("");
}

// ---- phone helpers: "011 555 0142" -> "+27115550142" ----
function toTel(display) {
  const d = String(display || "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("0") ? "+27" + d.slice(1) : "+" + d;
}
function toWa(display) {
  return toTel(display).replace("+", "");
}

const ICONS = {
  window: '<rect x="6" y="6" width="36" height="36" rx="3"/><path d="M24 6v36M6 24h36"/>',
  door: '<rect x="10" y="4" width="28" height="40" rx="3"/><circle cx="32" cy="26" r="2" fill="currentColor"/>',
  shopfront: '<path d="M4 18h40v26H4zM8 18l4-10h24l4 10M20 44V28h8v16"/>',
  balustrade: '<path d="M4 12h40M4 40h40M10 12v28M20 12v28M30 12v28M40 12v28"/>',
  carport: '<path d="M4 18l20-10 20 10M8 18v24M40 18v24M4 42h40"/>',
  glass: '<path d="M8 40l32-32M8 24L24 8M24 40l16-16"/>',
  tools: '<path d="M10 38l14-14M30 10a8 8 0 0 0-8 10L8 34l6 6 14-14a8 8 0 0 0 10-8l-6 6-6-2-2-6z"/>',
  star: '<path d="M24 6l5.5 11.5L42 19l-9 8.7 2.2 12.3L24 34l-11.2 6 2.2-12.3L6 19l12.5-1.5z"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">${ICONS[name] || ICONS.star}</svg>`;

function buildCss(brand, night) {
  const brandDark = mix(brand, "#000000", 0.28);
  const brandLight = mix(brand, "#ffffff", 0.5);
  const glassA = mix(brand, "#ffffff", 0.84);
  const glassB = mix(brand, "#ffffff", 0.66);
  return `
  :root {
    --ink:#172126; --ink-soft:#4a5a61; --sand:#f5f2ec; --white:#ffffff; --line:#ddd7cb;
    --teal:${brand}; --teal-dark:${brandDark}; --teal-light:${brandLight}; --night:${night};
    --glass:${glassA}; --glass-b:${glassB};
    --serif:"Fraunces", Georgia, "Times New Roman", serif;
    --sans:"Manrope", "Segoe UI", system-ui, sans-serif;
  }
  * { box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { margin:0; font-family:var(--sans); color:var(--ink); background:var(--sand); line-height:1.6; }
  img, svg { max-width:100%; }
  a { color:inherit; }
  a:focus-visible, button:focus-visible { outline:3px solid var(--teal); outline-offset:3px; border-radius:4px; }
  .container { width:min(1120px, 92%); margin:0 auto; }
  .strip { background:var(--night); color:#d4e0e3; font-size:.85rem; }
  .strip .container { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:8px 0; }
  .strip a { text-decoration:none; }
  .strip a:hover { text-decoration:underline; }
  .strip a + a { margin-left:18px; }
  header { background:var(--sand); border-bottom:1px solid var(--line); position:sticky; top:0; z-index:10; }
  .nav { display:flex; align-items:center; justify-content:space-between; padding:14px 0; gap:16px; }
  .logo { font-family:var(--serif); font-weight:700; font-size:1.55rem; text-decoration:none; letter-spacing:-.01em; }
  .logo b { color:var(--teal); }
  .nav ul { display:flex; gap:26px; list-style:none; margin:0; padding:0; }
  .nav ul a { text-decoration:none; font-weight:600; font-size:.95rem; }
  .nav ul a:hover { color:var(--teal); }
  .btn { display:inline-block; background:var(--teal); color:#fff; font-weight:800; text-decoration:none; padding:12px 22px; border-radius:999px; border:0; font-size:.95rem; }
  .btn:hover { background:var(--teal-dark); }
  .btn.ghost { background:transparent; color:var(--ink); border:2px solid var(--ink); }
  .btn.ghost:hover { background:var(--ink); color:#fff; }
  .hero { padding:56px 0 64px; }
  .hero .container { display:grid; grid-template-columns:1.1fr .9fr; gap:48px; align-items:center; }
  .eyebrow { font-weight:800; font-size:.8rem; letter-spacing:.14em; text-transform:uppercase; color:var(--teal); margin:0 0 14px; }
  h1, h2, h3 { font-family:var(--serif); line-height:1.12; margin:0; letter-spacing:-.015em; }
  h1 { font-size:clamp(2.2rem, 5vw, 3.6rem); }
  h2 { font-size:clamp(1.7rem, 3.4vw, 2.5rem); }
  .lead { font-size:1.15rem; color:var(--ink-soft); max-width:34em; margin:18px 0 28px; }
  .cta { display:flex; gap:12px; flex-wrap:wrap; }
  .ticks { display:flex; gap:22px; flex-wrap:wrap; list-style:none; padding:0; margin:28px 0 0; font-weight:600; font-size:.92rem; color:var(--ink-soft); }
  .ticks li::before { content:"\\2713"; color:var(--teal); font-weight:800; margin-right:7px; }
  .hero-art { background:linear-gradient(160deg, var(--glass), var(--glass-b)); border-radius:28px; padding:28px; box-shadow:0 30px 60px -30px rgba(16,26,30,.45); }
  .stats { background:var(--night); color:#fff; }
  .stats .container { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:20px; padding:30px 0; text-align:center; }
  .stats strong { display:block; font-family:var(--serif); font-size:2.2rem; color:var(--teal-light); }
  .stats span { font-size:.9rem; color:#bccbcf; }
  section { padding:72px 0; }
  .head { max-width:40em; margin-bottom:38px; }
  .head p { color:var(--ink-soft); margin:12px 0 0; }
  .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .card { background:var(--white); border:1px solid var(--line); border-radius:18px; padding:26px; }
  .card svg { width:46px; height:46px; margin-bottom:14px; color:var(--teal); }
  .card h3 { font-size:1.3rem; margin-bottom:8px; }
  .card p { margin:0; color:var(--ink-soft); font-size:.97rem; }
  .steps { background:var(--white); border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
  .step .n { font-family:var(--serif); font-size:2.6rem; color:var(--teal); line-height:1; }
  .step h3 { font-size:1.25rem; margin:10px 0 6px; }
  .step p { margin:0; color:var(--ink-soft); }
  .quote { background:linear-gradient(180deg, var(--sand), var(--glass)); }
  .quote .wrap { display:grid; grid-template-columns:.8fr 1.2fr; gap:44px; align-items:start; }
  .quote ul { padding-left:1.1em; color:var(--ink-soft); }
  .frame { background:var(--white); border:1px solid var(--line); border-radius:22px; padding:22px; box-shadow:0 30px 60px -36px rgba(16,26,30,.5); }
  .frame iframe { width:100%; height:560px; border:0; display:block; }
  .powered { margin:10px 0 0; text-align:right; font-size:.78rem; color:var(--ink-soft); }
  .proj { border-radius:18px; overflow:hidden; background:var(--white); border:1px solid var(--line); }
  .proj .pic { height:150px; display:flex; align-items:flex-end; padding:14px; color:#fff; font-weight:800; font-size:.8rem; letter-spacing:.08em; text-transform:uppercase; }
  .proj:nth-child(3n+1) .pic { background:linear-gradient(135deg,var(--teal),var(--night)); }
  .proj:nth-child(3n+2) .pic { background:linear-gradient(135deg,#6b7d84,#27353b); }
  .proj:nth-child(3n) .pic { background:linear-gradient(135deg,var(--teal-light),var(--teal-dark)); }
  .proj .t { padding:18px 20px 22px; }
  .proj h3 { font-size:1.15rem; margin-bottom:6px; }
  .proj p { margin:0; color:var(--ink-soft); font-size:.95rem; }
  .reviews { background:var(--night); color:#fff; }
  .reviews .card { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.14); }
  .reviews .card p { color:#d4e0e3; }
  .stars { color:#f2b84b; letter-spacing:2px; margin-bottom:10px; }
  .who { margin-top:14px; font-weight:800; font-size:.92rem; }
  .who span { display:block; font-weight:400; color:#a9bbc0; }
  .contact .wrap { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  .contact h3 { margin-bottom:14px; }
  .contact dl { margin:0; display:grid; grid-template-columns:auto 1fr; gap:10px 18px; }
  .contact dt { font-weight:800; }
  .contact dd { margin:0; color:var(--ink-soft); }
  .contact a { color:var(--teal-dark); font-weight:600; }
  .contact dd { overflow-wrap:anywhere; }
  .wrap > *, .container > * { min-width:0; }
  footer { background:var(--night); color:#a9bbc0; font-size:.88rem; padding:30px 0; }
  footer .container { display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap; }
  footer a { color:#d4e0e3; }
  @media (max-width: 900px) {
    .hero .container, .quote .wrap, .contact .wrap { grid-template-columns:minmax(0,1fr); }
    .grid3 { grid-template-columns:minmax(0,1fr); }
    .contact dl { grid-template-columns:1fr; gap:2px 0; }
    .contact dd { margin-bottom:10px; }
    .nav ul { display:none; }
    .hero-art { order:-1; }
    section { padding:52px 0; }
  }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior:auto; } }
`;
}

function renderSite(c) {
  const brand = validHex(c.colors && c.colors.brand, "#1f7a8c");
  const night = validHex(c.colors && c.colors.dark, "#101a1e");
  const brandDark = mix(brand, "#000000", 0.28);
  const glassA = mix(brand, "#ffffff", 0.84);
  const glassB = mix(brand, "#ffffff", 0.66);
  const glassC = mix(brand, "#ffffff", 0.45);
  const brandLight = mix(brand, "#ffffff", 0.5);

  const name = c.businessName;
  const words = name.trim().split(/\s+/);
  const logo = words.length > 1 ? `${esc(words.slice(0, -1).join(" "))}<b>${esc(words[words.length - 1])}</b>` : esc(name);

  const h = c.hero || {};
  const sv = c.services || {};
  const q = c.quote || {};
  const ct = c.contact || {};
  const emails = ct.emails || [];
  const firstEmail = emails[0] ? emails[0].address : "";
  const tel = toTel(ct.phone);
  const title = (c.seo && c.seo.title) || `${name} | ${c.tagline || ""}`;
  const desc = (c.seo && c.seo.description) || c.tagline || "";

  const list = (arr, fn) => (arr || []).map(fn).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;600;800&display=swap" rel="stylesheet">
<style>
${buildCss(brand, night)}
</style>
</head>
<body>

<div class="strip">
  <div class="container">
    <span>${esc(c.stripHours || "")}</span>
    <span>${tel ? `<a href="tel:${esc(tel)}">${esc(ct.phone)}</a>` : ""}${firstEmail ? `<a href="mailto:${esc(firstEmail)}">${esc(firstEmail)}</a>` : ""}</span>
  </div>
</div>

<header>
  <div class="container nav">
    <a class="logo" href="#top" aria-label="${esc(name)} home">${logo}</a>
    <nav aria-label="Main">
      <ul>
        <li><a href="#services">Services</a></li>
        <li><a href="#process">How it works</a></li>
        ${(c.projects || []).length ? '<li><a href="#work">Our work</a></li>' : ""}
        ${(c.reviews || []).length ? '<li><a href="#reviews">Reviews</a></li>' : ""}
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
    <a class="btn" href="#quote">Get an instant quote</a>
  </div>
</header>

<main id="top">

<section class="hero">
  <div class="container">
    <div>
      <p class="eyebrow">${esc(h.eyebrow)}</p>
      <h1>${esc(h.headline)}</h1>
      <p class="lead">${esc(h.lead)}</p>
      <div class="cta">
        <a class="btn" href="#quote">Get an instant quote</a>
        ${tel ? `<a class="btn ghost" href="tel:${esc(tel)}">Call ${esc(ct.phone)}</a>` : ""}
      </div>
      <ul class="ticks">${list(h.checks, (t) => `<li>${esc(t)}</li>`)}</ul>
    </div>
    <div class="hero-art">
      <svg viewBox="0 0 400 340" role="img" aria-label="Illustration of an aluminium sliding window">
        <defs>
          <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${mix(brand, "#ffffff", 0.93)}"/><stop offset="1" stop-color="${glassC}"/>
          </linearGradient>
        </defs>
        <rect x="30" y="24" width="340" height="292" rx="14" fill="#2b3a40"/>
        <rect x="46" y="40" width="308" height="260" rx="6" fill="#4d5f66"/>
        <rect x="56" y="50" width="142" height="240" fill="url(#gl)"/>
        <rect x="202" y="50" width="142" height="240" fill="url(#gl)"/>
        <rect x="196" y="46" width="8" height="248" fill="#2b3a40"/>
        <path d="M70 280 L150 60 L172 60 L92 280 Z" fill="#fff" opacity=".35"/>
        <path d="M215 280 L275 110 L290 110 L230 280 Z" fill="#fff" opacity=".25"/>
        <rect x="178" y="150" width="14" height="46" rx="4" fill="#1b262b"/>
        <rect x="30" y="306" width="340" height="14" rx="4" fill="#1b262b"/>
      </svg>
    </div>
  </div>
</section>

${(c.stats || []).length ? `<div class="stats"><div class="container">${list(c.stats, (s) => `<div><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`)}</div></div>` : ""}

<section id="services">
  <div class="container">
    <div class="head">
      <p class="eyebrow">${esc(sv.eyebrow || "What we do")}</p>
      <h2>${esc(sv.heading)}</h2>
      <p>${esc(sv.intro)}</p>
    </div>
    <div class="grid3">
      ${list(sv.items, (i) => `<article class="card">${icon(i.icon)}<h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></article>`)}
    </div>
  </div>
</section>

<section id="process" class="steps">
  <div class="container">
    <div class="head">
      <p class="eyebrow">How it works</p>
      <h2>${esc(c.stepsHeading || "From first click to finished job")}</h2>
    </div>
    <div class="grid3">
      ${list(c.steps, (s, i) => `<div class="step"><div class="n">${i + 1}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`)}
    </div>
  </div>
</section>

<section id="quote" class="quote">
  <div class="container wrap">
    <div>
      <p class="eyebrow">Instant quote</p>
      <h2>${esc(q.heading || "Know your price before you pick up the phone")}</h2>
      <p style="color:var(--ink-soft);margin:14px 0">${esc(q.intro)}</p>
      <ul>${list(q.bullets, (b) => `<li>${esc(b)}</li>`)}</ul>
    </div>
    <div>
      <div class="frame">
        <iframe id="quoteFrame" src="/q/${esc(c.id)}" title="${esc(name)} instant quote tool" loading="lazy"></iframe>
      </div>
      ${c.showPoweredBy === false ? "" : '<p class="powered">Instant quotes powered by InstaQuote</p>'}
    </div>
  </div>
</section>

${(c.projects || []).length ? `<section id="work"><div class="container">
  <div class="head"><p class="eyebrow">Recent work</p><h2>${esc(c.projectsHeading || "A few jobs we're proud of")}</h2></div>
  <div class="grid3">${list(c.projects, (p) => `<article class="proj"><div class="pic">${esc(p.tag)}</div><div class="t"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div></article>`)}</div>
</div></section>` : ""}

${(c.reviews || []).length ? `<section id="reviews" class="reviews"><div class="container">
  <div class="head"><p class="eyebrow">Reviews</p><h2>What our customers say</h2></div>
  <div class="grid3">${list(c.reviews, (r) => `<article class="card"><div class="stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p>${esc(r.text)}</p><div class="who">${esc(r.name)}<span>${esc(r.place)}</span></div></article>`)}</div>
</div></section>` : ""}

<section id="contact" class="contact">
  <div class="container">
    <div class="head"><p class="eyebrow">Contact</p><h2>Talk to the team</h2></div>
    <div class="wrap">
      <div class="card">
        <h3>Get in touch</h3>
        <dl>
          ${tel ? `<dt>Phone</dt><dd><a href="tel:${esc(tel)}">${esc(ct.phone)}</a></dd>` : ""}
          ${ct.whatsapp ? `<dt>WhatsApp</dt><dd><a href="https://wa.me/${esc(toWa(ct.whatsapp))}">${esc(ct.whatsapp)}</a></dd>` : ""}
          ${list(emails, (e) => `<dt>${esc(e.label)}</dt><dd><a href="mailto:${esc(e.address)}">${esc(e.address)}</a></dd>`)}
        </dl>
      </div>
      <div class="card">
        <h3>Visit us</h3>
        <dl>
          ${(ct.address || []).length ? `<dt>Address</dt><dd>${(ct.address || []).map(esc).join("<br>")}</dd>` : ""}
          ${(ct.hours || []).length ? `<dt>Hours</dt><dd>${(ct.hours || []).map(esc).join("<br>")}</dd>` : ""}
          ${ct.areas ? `<dt>Areas</dt><dd>${esc(ct.areas)}</dd>` : ""}
        </dl>
      </div>
    </div>
  </div>
</section>

</main>

<footer>
  <div class="container">
    <span>&copy; ${new Date().getFullYear()} ${esc(c.legalName || name)}. All rights reserved.</span>
    <span>${c.footerNote ? esc(c.footerNote) + " &middot; " : ""}${firstEmail ? `<a href="mailto:${esc(firstEmail)}">${esc(firstEmail)}</a>` : ""}</span>
  </div>
</footer>

<script>
  // The quote tool tells us how tall it is, so the box always fits it.
  window.addEventListener("message", function (e) {
    var frame = document.getElementById("quoteFrame");
    if (e.origin !== location.origin || !frame || e.source !== frame.contentWindow) return;
    if (e.data && e.data.type === "iq-height" && e.data.height) {
      frame.style.height = Math.max(e.data.height + 4, 520) + "px";
    }
  });
</script>
</body>
</html>`;
}

module.exports = { renderSite, buildCss, mix, esc };
