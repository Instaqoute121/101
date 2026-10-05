/**
 * The InstaQuote sales website: explains what InstaQuote is, shows the real
 * live demo, lists the plans, and lets people contact you to get started.
 * It uses the same colours, fonts and styling as the Glass Right demo.
 *
 * =====================================================================
 *  EDIT THE TWO BLOCKS BELOW: your contact details and your plans.
 *  The prices are STARTING SUGGESTIONS. Change them to what you want.
 * =====================================================================
 */

// Leave phone or whatsapp as "" to hide them.
const CONTACT = {
  email: "mandlenkosizwane174@gmail.com",
  phone: "083 675 2486",
  whatsapp: "083 675 2486",
};

const PRICE_NOTE = "All prices exclude VAT. Setup is paid once; the monthly fee covers hosting, price updates and support.";

// paymentUrl: paste a payment link (PayFast, Yoco, Stripe...) to turn the
// button into "Buy now". Leave it "" and the button opens the contact form.
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Your own quote link",
    setup: "R1,500",
    monthly: "R199",
    features: [
      "Your own quote page with your name and colours",
      "Your prices and options loaded for you",
      "Share it on WhatsApp, Facebook and email",
      "Every customer request saved with their details",
    ],
    paymentUrl: "",
  },
  {
    id: "business",
    name: "Business",
    tagline: "Quote tool on your website",
    setup: "R3,500",
    monthly: "R399",
    featured: true,
    features: [
      "Everything in Starter",
      "Installed on your existing website for you",
      "Tested on phone and desktop before it goes live",
      "Price updates whenever your costs change",
    ],
    paymentUrl: "",
  },
  {
    id: "complete",
    name: "Complete",
    tagline: "Website plus quote tool",
    setup: "R6,500",
    monthly: "R599",
    features: [
      "Everything in Business",
      "A professional website built around the quote tool",
      "Your own domain connected",
      "Ongoing support and changes",
    ],
    paymentUrl: "",
  },
];

const { buildCss, esc } = require("./site.js");

const BRAND = "#1f7a8c";
const NIGHT = "#101a1e";

const toTel = (d) => {
  const n = String(d || "").replace(/\D/g, "");
  return n ? (n.startsWith("0") ? "+27" + n.slice(1) : "+" + n) : "";
};

/**
 * demoId       the client whose live quote tool is shown first
 * sampleLinks  [{id, name}] demo businesses to switch between
 */
function renderLanding({ demoId, sampleLinks }) {
  const mailto = `mailto:${esc(CONTACT.email)}?subject=${encodeURIComponent("I'd like InstaQuote for my business")}`;
  const tel = toTel(CONTACT.phone);
  const waNumber = toTel(CONTACT.whatsapp).replace("+", "");
  const demos = (sampleLinks || []).slice(0, 3);
  const first = demos.find((d) => d.id === demoId) || demos[0];

  const demoTabs = demos
    .map((d) => `<button type="button" class="tab${first && d.id === first.id ? " on" : ""}" data-id="${esc(d.id)}">${esc(d.name)}</button>`)
    .join("");

  const demoBlock = first
    ? `<div class="tabs" role="tablist" aria-label="Choose a demo business">${demoTabs}</div>
       <div class="browser">
         <div class="bar"><i></i><i></i><i></i><span class="url" id="demoUrl">yourbusiness.co.za/quote</span></div>
         <iframe id="quoteFrame" src="/q/${esc(first.id)}" title="InstaQuote live demo" loading="lazy"></iframe>
       </div>
       <p class="powered">Live demo with a fictional business. <a id="demoSite" href="/s/${esc(first.id)}">Open its full demo website</a></p>`
    : `<div class="frame"><p>The live demo isn't available right now. Please check back soon.</p></div>`;

  const planCards = PLANS.map((p) => {
    const action = p.paymentUrl
      ? `<a class="btn" href="${esc(p.paymentUrl)}" rel="noopener">Buy now</a>`
      : `<button type="button" class="btn pick" data-plan="${esc(p.name)}">Get started</button>`;
    return `<article class="plan${p.featured ? " featured" : ""}">
      ${p.featured ? '<span class="pop">Most popular</span>' : ""}
      <h3>${esc(p.name)}</h3>
      <p class="sub">${esc(p.tagline)}</p>
      <div class="price"><strong>${esc(p.setup)}</strong><span>once-off setup</span></div>
      <div class="monthly">+ ${esc(p.monthly)} per month</div>
      <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      ${action}
    </article>`;
  }).join("");

  const planOptions =
    PLANS.map((p) => `<option>${esc(p.name)}</option>`).join("") + "<option>Not sure yet</option>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>InstaQuote | Instant online quotes for aluminium, glass and building businesses</title>
<meta name="description" content="InstaQuote puts an instant quote calculator on your website and captures every enquiry as a lead. See the live demo and get started.">
<meta property="og:title" content="InstaQuote | Instant online quotes for your business">
<meta property="og:description" content="Give customers a price in seconds and capture every enquiry. Try the live demo.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;600;800&display=swap" rel="stylesheet">
<style>
${buildCss(BRAND, NIGHT)}
  .grid2 { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
  .grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
  .card .big { font-family:var(--serif); font-size:1.05rem; font-weight:700; color:var(--teal); margin-bottom:6px; display:block; }
  .tryit { margin-top:18px; padding:14px 16px; background:var(--white); border:1px dashed var(--teal); border-radius:12px; font-size:.93rem; color:var(--ink-soft); }
  .tryit b { color:var(--ink); }
  .links { display:flex; gap:12px; flex-wrap:wrap; margin-top:20px; }
  .powered a { color:var(--teal-dark); font-weight:600; }
  /* demo window */
  .tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
  .tab { font:inherit; font-weight:700; font-size:.9rem; padding:8px 16px; border-radius:999px; border:2px solid var(--line); background:var(--white); color:var(--ink); cursor:pointer; }
  .tab.on { background:var(--night); border-color:var(--night); color:#fff; }
  .tab:focus-visible { outline:3px solid var(--teal); outline-offset:2px; }
  .browser { background:var(--white); border:1px solid var(--line); border-radius:18px; overflow:hidden; box-shadow:0 30px 60px -36px rgba(16,26,30,.55); }
  .browser .bar { display:flex; align-items:center; gap:7px; padding:11px 14px; background:#efece4; border-bottom:1px solid var(--line); }
  .browser .bar i { width:11px; height:11px; border-radius:50%; background:#cfc8b8; display:block; }
  .browser .url { margin-left:10px; flex:1; background:#fff; border-radius:999px; padding:3px 14px; font-size:.78rem; color:var(--ink-soft); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
  .browser iframe { width:100%; height:560px; border:0; display:block; padding:14px; background:var(--white); }
  /* plans */
  .plans { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; align-items:stretch; }
  .plan { background:var(--white); border:1px solid var(--line); border-radius:22px; padding:30px 26px; display:flex; flex-direction:column; position:relative; }
  .plan.featured { border:2px solid var(--teal); box-shadow:0 30px 60px -34px rgba(31,122,140,.6); }
  .pop { position:absolute; top:-13px; left:26px; background:var(--teal); color:#fff; font-size:.72rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; padding:5px 12px; border-radius:999px; }
  .plan h3 { font-size:1.5rem; }
  .plan .sub { margin:4px 0 18px; color:var(--ink-soft); }
  .plan .price strong { font-family:var(--serif); font-size:2.4rem; }
  .plan .price span { color:var(--ink-soft); font-size:.9rem; margin-left:8px; }
  .plan .monthly { font-weight:800; color:var(--teal-dark); margin:4px 0 18px; }
  .plan ul { list-style:none; padding:0; margin:0 0 24px; flex:1; }
  .plan li { padding:7px 0 7px 26px; position:relative; color:var(--ink-soft); font-size:.95rem; border-top:1px solid var(--line); }
  .plan li::before { content:"\\2713"; position:absolute; left:0; color:var(--teal); font-weight:800; }
  .plan .btn { text-align:center; cursor:pointer; font-family:inherit; }
  .note { margin-top:22px; color:var(--ink-soft); font-size:.9rem; text-align:center; }
  /* code + faq */
  pre.code { background:var(--night); color:#d4e0e3; padding:20px; border-radius:14px; overflow-x:auto; font-size:.88rem; line-height:1.55; margin:18px 0 0; }
  .split { display:grid; grid-template-columns:1fr 1fr; gap:44px; align-items:center; }
  details { background:var(--white); border:1px solid var(--line); border-radius:14px; padding:16px 20px; }
  details + details { margin-top:12px; }
  summary { cursor:pointer; font-weight:800; }
  details p { margin:10px 0 0; color:var(--ink-soft); }
  /* contact */
  .getstarted { background:var(--night); color:#fff; }
  .getstarted .wrap { display:grid; grid-template-columns:.9fr 1.1fr; gap:44px; align-items:start; }
  .getstarted h2 { color:#fff; }
  .getstarted .eyebrow { color:var(--teal-light); }
  .getstarted .lead { color:#bccbcf; }
  .ways { list-style:none; padding:0; margin:26px 0 0; display:grid; gap:14px; }
  .ways a { color:#fff; font-weight:700; text-decoration:none; }
  .ways a:hover { text-decoration:underline; }
  .ways small { display:block; color:#9fb2b8; font-weight:400; }
  .form { background:var(--white); color:var(--ink); border-radius:22px; padding:26px; display:grid; gap:14px; }
  .form .row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .form label { display:grid; gap:4px; font-size:.9rem; font-weight:700; }
  .form input, .form select, .form textarea { font:inherit; padding:11px; border:1px solid var(--line); border-radius:10px; background:#fff; width:100%; }
  .form textarea { min-height:90px; resize:vertical; }
  .form input:focus-visible, .form select:focus-visible, .form textarea:focus-visible, .form button:focus-visible { outline:3px solid var(--teal); outline-offset:1px; }
  .form button { font:inherit; font-weight:800; padding:14px; border:0; border-radius:999px; background:var(--teal); color:#fff; cursor:pointer; }
  .form button:hover { background:var(--teal-dark); }
  .form button:disabled { opacity:.6; cursor:wait; }
  .hp { position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
  .fine { font-size:.8rem; color:var(--ink-soft); margin:0; }
  #formError { color:#a32020; font-weight:600; display:none; margin:0; }
  #thanks { display:none; text-align:center; padding:12px 0; }
  #thanks h3 { font-size:1.6rem; margin-bottom:8px; }
  #thanks p { color:var(--ink-soft); }
  #thanks .btn { margin-top:12px; }
  @media (max-width: 900px) {
    .grid2, .grid4, .split, .plans, .getstarted .wrap { grid-template-columns:minmax(0,1fr); }
    .form .row { grid-template-columns:minmax(0,1fr); }
    pre.code { font-size:.78rem; }
    .browser iframe { padding:8px; }
  }
</style>
</head>
<body>

<div class="strip">
  <div class="container">
    <span>Instant online quotes for aluminium, glass and building businesses</span>
    <span>${tel ? `<a href="tel:${esc(tel)}">${esc(CONTACT.phone)}</a>` : ""}<a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a></span>
  </div>
</div>

<header>
  <div class="container nav">
    <a class="logo" href="#top" aria-label="InstaQuote home">Insta<b>Quote</b></a>
    <nav aria-label="Main">
      <ul>
        <li><a href="#demo">Live demo</a></li>
        <li><a href="#how">How it works</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
    <a class="btn" href="#contact">Get started</a>
  </div>
</header>

<main id="top">

<section class="hero">
  <div class="container">
    <div>
      <p class="eyebrow">Instant quoting for aluminium &amp; glass businesses</p>
      <h1>Give every customer a price in seconds.</h1>
      <p class="lead">InstaQuote puts a quote calculator on your website. Customers enter their sizes, see an estimate straight away and leave their number, so you stop losing enquiries to whoever answers first.</p>
      <div class="cta">
        <a class="btn" href="#demo">See the live demo</a>
        <a class="btn ghost" href="#contact">Get started</a>
      </div>
      <ul class="ticks">
        <li>Your own prices</li>
        <li>Your own branding</li>
        <li>Every enquiry saved</li>
      </ul>
    </div>
    <div class="hero-art">
      <svg viewBox="0 0 400 340" role="img" aria-label="Illustration of an InstaQuote price estimate">
        <rect x="40" y="24" width="320" height="292" rx="22" fill="#ffffff"/>
        <rect x="64" y="52" width="130" height="14" rx="7" fill="#2b3a40"/>
        <rect x="64" y="86" width="272" height="34" rx="9" fill="#eaf3f5" stroke="#c9dcdd"/>
        <rect x="78" y="99" width="90" height="8" rx="4" fill="#9fb4ba"/>
        <rect x="64" y="132" width="130" height="34" rx="9" fill="#eaf3f5" stroke="#c9dcdd"/>
        <rect x="78" y="145" width="60" height="8" rx="4" fill="#9fb4ba"/>
        <rect x="206" y="132" width="130" height="34" rx="9" fill="#eaf3f5" stroke="#c9dcdd"/>
        <rect x="220" y="145" width="60" height="8" rx="4" fill="#9fb4ba"/>
        <rect x="64" y="182" width="272" height="94" rx="14" fill="#1f7a8c"/>
        <text x="84" y="212" fill="#cfeaf0" font-family="Manrope, Segoe UI, sans-serif" font-size="14" font-weight="600">Estimated price</text>
        <text x="84" y="254" fill="#ffffff" font-family="Fraunces, Georgia, serif" font-size="32" font-weight="700">R3,150 to R3,690</text>
        <circle cx="332" cy="46" r="18" fill="#8fd3e1"/>
        <path d="M324 46l6 6 11-12" fill="none" stroke="#10424c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</section>

<div class="stats">
  <div class="container">
    <div><strong>24/7</strong><span>Quotes, even after hours</span></div>
    <div><strong>1 link</strong><span>Works anywhere you share it</span></div>
    <div><strong>0 apps</strong><span>Nothing for customers to install</span></div>
    <div><strong>100%</strong><span>Your prices, your rules</span></div>
  </div>
</div>

<section id="what">
  <div class="container">
    <div class="head">
      <p class="eyebrow">Why InstaQuote</p>
      <h2>Quotes shouldn't take days</h2>
      <p>Most window, door and glass businesses still quote by phone, WhatsApp or email. Customers wait, get impatient and call the next company. InstaQuote fixes that.</p>
    </div>
    <div class="grid3">
      <article class="card"><span class="big">The problem</span><h3>Slow quotes lose jobs</h3><p>Every enquiry that waits for a price is a customer who may already be talking to a competitor, and your team spends hours answering the same price questions.</p></article>
      <article class="card"><span class="big">What it does</span><h3>An instant price estimate</h3><p>Customers pick a product, enter the size and finish, and see a price range in seconds, based on your own rates. They leave their details so you can follow up.</p></article>
      <article class="card"><span class="big">The result</span><h3>More leads, less admin</h3><p>Visitors become enquiries you can call back, already knowing roughly what they will pay. Your time goes to real buyers, not price checks.</p></article>
    </div>
  </div>
</section>

<section id="demo" class="quote">
  <div class="container wrap">
    <div>
      <p class="eyebrow">Live demo</p>
      <h2>Try the real system, right now</h2>
      <p style="color:var(--ink-soft);margin:14px 0">This is the actual tool your customers would use, set up for pretend businesses. Switch between them to see how each gets its own name, colours and prices.</p>
      <div class="tryit"><b>Try this:</b> choose <b>Window</b>, enter <b>1500</b> by <b>1200</b> mm, pick a finish and press <b>Get my estimate</b>. Then switch business and compare the price.</div>
      <div class="links"><a class="btn" href="#contact">I want this for my business</a></div>
    </div>
    <div>
      ${demoBlock}
    </div>
  </div>
</section>

<section id="how" class="steps">
  <div class="container">
    <div class="head">
      <p class="eyebrow">How it works</p>
      <h2>Live on your website in three steps</h2>
    </div>
    <div class="grid3">
      <div class="step"><div class="n">1</div><h3>You tell us your prices</h3><p>Share how you price your products. We load your rates, finishes and options, and add your business name and colours.</p></div>
      <div class="step"><div class="n">2</div><h3>We put it online</h3><p>We add the quote tool to your website, or give you a link to share on WhatsApp and social media. No website? We can build one.</p></div>
      <div class="step"><div class="n">3</div><h3>Customers quote themselves</h3><p>They get an instant estimate and leave their number. Every request is saved with their details and what they asked for.</p></div>
    </div>
  </div>
</section>

<section id="features">
  <div class="container">
    <div class="head">
      <p class="eyebrow">Features</p>
      <h2>Everything a quoting tool should do</h2>
    </div>
    <div class="grid3">
      <article class="card"><h3>Your prices</h3><p>Your own rate card, finishes, glazing and access options. We update them whenever your costs change.</p></article>
      <article class="card"><h3>Your branding</h3><p>Your name, your colours and your wording, so it feels like part of your business.</p></article>
      <article class="card"><h3>Works on any website</h3><p>WordPress, Wix, Squarespace or a custom site. One snippet of code, or just share the link.</p></article>
      <article class="card"><h3>Captures every lead</h3><p>Name, phone number, the product, the size and the price shown are all saved for your follow-up.</p></article>
      <article class="card"><h3>Mobile friendly</h3><p>Most customers browse on their phones. The tool fits any screen, with no app to install.</p></article>
      <article class="card"><h3>Private and protected</h3><p>The price calculation happens on the server, so customers see the estimate but never your rate card. Your lead list is password protected.</p></article>
    </div>
  </div>
</section>

<section id="pricing" class="steps">
  <div class="container">
    <div class="head">
      <p class="eyebrow">Pricing</p>
      <h2>Simple plans, no surprises</h2>
      <p>Pick the plan that fits where you are. You can move up any time.</p>
    </div>
    <div class="plans">${planCards}</div>
    <p class="note">${esc(PRICE_NOTE)} Need something different? <a href="#contact" style="color:var(--teal-dark);font-weight:700">Talk to us</a>.</p>
  </div>
</section>

<section id="who">
  <div class="container">
    <div class="head">
      <p class="eyebrow">Who it's for</p>
      <h2>Built for businesses that quote by size</h2>
    </div>
    <div class="grid4">
      <article class="card"><h3>Aluminium windows &amp; doors</h3><p>Sliding, stacking and hinged, priced by size and finish.</p></article>
      <article class="card"><h3>Glass &amp; glazing</h3><p>Panes, shopfronts and balustrades priced by area or length.</p></article>
      <article class="card"><h3>Carports &amp; covers</h3><p>Standard sizes and custom builds with clear pricing rules.</p></article>
      <article class="card"><h3>Similar trades</h3><p>Any business that prices by area, length or options can use it.</p></article>
    </div>
  </div>
</section>

<section id="embed" class="steps">
  <div class="container split">
    <div>
      <p class="eyebrow">Easy to add</p>
      <h2>One snippet and it's on your website</h2>
      <p style="color:var(--ink-soft);margin:14px 0 0">This is all it takes on a typical website: paste it into a Custom HTML or Embed block. We do it for you on the Business and Complete plans.</p>
    </div>
    <div>
<pre class="code">&lt;iframe src="https://YOUR-ADDRESS/q/your-business"
        style="width:100%; height:800px; border:0;"
        title="Instant quote"&gt;&lt;/iframe&gt;</pre>
    </div>
  </div>
</section>

<section id="faq">
  <div class="container">
    <div class="head">
      <p class="eyebrow">Questions</p>
      <h2>Good to know</h2>
    </div>
    <details open><summary>Is the price final?</summary><p>No. It's an estimate shown as a range, and it clearly says the final price is confirmed after a site measurement. That protects you and keeps customers' expectations realistic.</p></details>
    <details><summary>Do I need a website?</summary><p>No. If you have one, we add the tool to it. If you don't, you get your own link to share on WhatsApp, Facebook, email and business cards, and the Complete plan includes a website.</p></details>
    <details><summary>How do I get started and pay?</summary><p>Send us your details using the form below. We contact you to confirm your products and prices, and then send a payment link or invoice. Your quote tool goes live once setup is paid.</p></details>
    <details><summary>Can I change my prices later?</summary><p>Yes. Your rates, finishes and options can be updated whenever your costs change.</p></details>
    <details><summary>Where do the enquiries go?</summary><p>Every request is saved with the customer's name, phone number, what they asked for and the price they were shown, so you can follow up quickly.</p></details>
    <details><summary>Can I cancel?</summary><p>Yes. The monthly plan has no long contract, and you can talk to us at any time about changing or stopping.</p></details>
  </div>
</section>

<section id="contact" class="getstarted">
  <div class="container wrap">
    <div>
      <p class="eyebrow">Get started</p>
      <h2>Let's put InstaQuote on your website</h2>
      <p class="lead">Tell us about your business and which plan you're interested in. We'll get back to you to talk through your products and prices.</p>
      <ul class="ways">
        ${waNumber ? `<li><a href="https://wa.me/${esc(waNumber)}?text=${encodeURIComponent("Hi, I'd like to know more about InstaQuote.")}">WhatsApp us</a><small>${esc(CONTACT.whatsapp)}</small></li>` : ""}
        ${tel ? `<li><a href="tel:${esc(tel)}">Call us</a><small>${esc(CONTACT.phone)}</small></li>` : ""}
        <li><a href="${mailto}">Email us</a><small>${esc(CONTACT.email)}</small></li>
      </ul>
    </div>
    <div>
      <form class="form" id="enquiry" novalidate>
        <div class="row">
          <label>Your name<input name="name" autocomplete="name" required></label>
          <label>Business name<input name="business" autocomplete="organization"></label>
        </div>
        <div class="row">
          <label>Phone<input name="phone" type="tel" autocomplete="tel"></label>
          <label>Email<input name="email" type="email" autocomplete="email"></label>
        </div>
        <label>Plan<select name="plan" id="planSelect">${planOptions}</select></label>
        <label>Tell us about your business<textarea name="message" placeholder="What do you sell? Do you have a website?"></textarea></label>
        <div class="hp" aria-hidden="true"><label>Leave this empty<input name="company_site" tabindex="-1" autocomplete="off"></label></div>
        <p id="formError" role="alert"></p>
        <button type="submit" id="send">Send my request</button>
        <p class="fine">We only use your details to contact you about InstaQuote and never share them.</p>
      </form>
      <div class="form" id="thanks" role="status">
        <h3>Thank you!</h3>
        <p>We've received your request and will contact you soon.</p>
        ${waNumber ? `<a class="btn" id="waFollow" href="https://wa.me/${esc(waNumber)}">Message us on WhatsApp</a>` : ""}
      </div>
    </div>
  </div>
</section>

</main>

<footer>
  <div class="container">
    <span>&copy; ${new Date().getFullYear()} InstaQuote. All rights reserved.</span>
    <span>${tel ? `<a href="tel:${esc(tel)}">${esc(CONTACT.phone)}</a> &middot; ` : ""}<a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a></span>
  </div>
</footer>

<script>
  var WA = ${JSON.stringify(waNumber)};

  // The demo tells us how tall it is, so the box always fits it.
  window.addEventListener("message", function (e) {
    var frame = document.getElementById("quoteFrame");
    if (e.origin !== location.origin || !frame || e.source !== frame.contentWindow) return;
    if (e.data && e.data.type === "iq-height" && e.data.height) {
      frame.style.height = Math.max(e.data.height + 4, 520) + "px";
    }
  });

  // Switch between demo businesses.
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("on"); });
      tab.classList.add("on");
      var id = tab.getAttribute("data-id");
      document.getElementById("quoteFrame").src = "/q/" + id;
      var site = document.getElementById("demoSite");
      if (site) site.href = "/s/" + id;
    });
  });

  // "Get started" on a plan selects that plan in the form.
  document.querySelectorAll(".pick").forEach(function (b) {
    b.addEventListener("click", function () {
      document.getElementById("planSelect").value = b.getAttribute("data-plan");
      document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
      var first = document.querySelector("#enquiry input[name=name]");
      setTimeout(function () { if (first) first.focus(); }, 400);
    });
  });

  // Send the request.
  var form = document.getElementById("enquiry");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("formError");
    var btn = document.getElementById("send");
    err.style.display = "none";
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    btn.disabled = true;
    fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.body.error || "Something went wrong. Please try again.");
        form.style.display = "none";
        var thanks = document.getElementById("thanks");
        thanks.style.display = "block";
        var wa = document.getElementById("waFollow");
        if (wa && WA) {
          var text = "Hi, I'm " + data.name + (data.business ? " from " + data.business : "") + ". I just sent a request for InstaQuote" + (data.plan ? " (" + data.plan + ")" : "") + ".";
          wa.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
        }
      })
      .catch(function (ex) {
        err.textContent = ex.message;
        err.style.display = "block";
        btn.disabled = false;
      });
  });
</script>
</body>
</html>`;
}

module.exports = { renderLanding };
