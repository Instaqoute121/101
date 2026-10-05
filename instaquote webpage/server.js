/**
 * InstaQuote server (multi-client).
 *
 * Every client is one file in the "clients" folder. For each client the
 * server provides:
 *   /s/<id>      their full website, with the quote tool built in
 *   /q/<id>      just the quote tool (this is what gets embedded)
 *   /embed/<id>  copy-paste code for putting the quote tool on THEIR website
 *   /            the InstaQuote website (see "Websites" below)
 *
 * API used by the quote tool:
 *   GET  /api/client   GET /api/rates   POST /api/quote
 *   GET  /api/quotes?key=...   the private lead log (needs ADMIN_KEY)
 *   POST /api/enquiry          "Get started" form on the InstaQuote website
 *   GET  /admin?key=...        private page listing enquiries and leads
 *
 * Pricing happens on the server using the database rate card.
 */

const express = require("express");
const path = require("path");
const fs = require("fs");

// Before anything else, make sure no file got lost or uploaded empty.
// (An empty file is the most common reason this app fails to start.)
{
  const publicFolder = fs.existsSync(path.join(__dirname, "public")) ? "public" : "PUBLIC";
  const needed = ["db.js", "pricing-engine.js", "clients.js", "site.js", "landing.js", "package.json", publicFolder + "/quote.html"];
  const bad = needed.filter((f) => {
    try { return fs.statSync(path.join(__dirname, f)).size === 0; } catch (e) { return true; }
  });
  if (bad.length) {
    console.error("\n*** STARTUP STOPPED ***");
    console.error("These files are missing or empty: " + bad.join(", "));
    console.error("Upload them again to GitHub (from the project files), push, and Railway will redeploy.\n");
    process.exit(1);
  }
}
const { getRateCard, getClient, syncClients, logQuote, listRecentQuotes, logEnquiry, listEnquiries } = require("./db.js");
const { calculateQuote } = require("./pricing-engine.js");
const { loadClientFiles } = require("./clients.js");
const { renderSite } = require("./site.js");
const { renderLanding } = require("./landing.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Load every client file and copy it into the database.
const clientFiles = loadClientFiles();
syncClients(clientFiles);
console.log("Clients loaded:", Object.keys(clientFiles).join(", ") || "(none)");

// The plain address "/" shows the InstaQuote website.
// To show one client's website there instead (for example when a client's
// own domain points at this app), set a Railway variable called
// DEFAULT_CLIENT to that client's id.
function defaultClientId() {
  const wanted = (process.env.DEFAULT_CLIENT || "").toLowerCase();
  return clientFiles[wanted] ? wanted : null;
}

// The client whose live quote tool is shown on the InstaQuote website.
function demoClientId() {
  const wanted = (process.env.DEMO_CLIENT || "glass-right").toLowerCase();
  if (clientFiles[wanted]) return wanted;
  return Object.keys(clientFiles)[0] || null;
}

// The page folder may be called "public" or "PUBLIC" (Windows doesn't care,
// but Railway does), so accept either.
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, "public"))
  ? path.join(__dirname, "public")
  : path.join(__dirname, "PUBLIC");

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

app.set("trust proxy", 1); // Railway sits in front of the app
app.use(express.json());

/** Which client is a request for? (header, ?client=, or the page it came from) */
function clientIdFromRequest(req) {
  if (req.query.client) return String(req.query.client);
  if (req.get("x-client-id")) return String(req.get("x-client-id"));
  const ref = req.get("referer");
  if (ref) {
    try {
      const m = new URL(ref).pathname.match(/^\/q\/([^/]+)/);
      if (m) return decodeURIComponent(m[1]);
    } catch (e) {}
  }
  return null;
}

// ---- Websites ----
function sendSite(res, id) {
  const config = id && clientFiles[id];
  if (!config) return res.status(404).send("Website not found.");
  res.type("html").send(renderSite(config));
}
function sendLanding(res) {
  const demoId = demoClientId();
  const sampleLinks = Object.values(clientFiles)
    .sort((a, b) => (a.id === demoId ? -1 : b.id === demoId ? 1 : 0))
    .slice(0, 3)
    .map((c) => ({ id: c.id, name: c.businessName }));
  res.type("html").send(renderLanding({ demoId, sampleLinks }));
}
app.get("/", (req, res) => {
  const id = defaultClientId();
  return id ? sendSite(res, id) : sendLanding(res);
});
app.get("/instaquote", (req, res) => sendLanding(res));
app.get("/s/:clientId", (req, res) => sendSite(res, req.params.clientId.toLowerCase()));

// ---- Quote tool on its own (this is what the iframe loads) ----
app.get("/q/:clientId", (req, res) => {
  if (!getClient(req.params.clientId)) {
    return res.status(404).send("Quote page not found.");
  }
  let html = fs.readFileSync(path.join(PUBLIC_DIR, "quote.html"), "utf8");
  // Make the page's files load from the site root even though the address is /q/something.
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (m) => m + '<base href="/">');
  } else {
    html = '<base href="/">' + html;
  }
  res.type("html").send(html);
});

// ---- Copy-paste code for a client's own website ----
app.get("/embed/:clientId", (req, res) => {
  const id = req.params.clientId.toLowerCase();
  const config = clientFiles[id];
  if (!config) return res.status(404).send("Client not found.");
  const base = `${req.get("x-forwarded-proto") || req.protocol}://${req.get("host")}`;
  const snippet =
    `<iframe src="${base}/q/${id}"\n        style="width:100%; height:800px; border:0;"\n        title="Instant quote"></iframe>`;
  res.type("html").send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Embed code - ${esc(config.businessName)}</title>
<style>body{font-family:Segoe UI,system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#172126}
textarea{width:100%;height:120px;font-family:Consolas,monospace;font-size:.9rem;padding:12px;border:1px solid #c9dcdd;border-radius:8px}
a{color:#155866}</style></head><body>
<h1>Embed code for ${esc(config.businessName)}</h1>
<p>Paste this into a "Custom HTML" or "Embed" block on the page where the quote tool should appear.</p>
<textarea readonly onclick="this.select()">${esc(snippet)}</textarea>
<p>Preview the tool: <a href="/q/${esc(id)}">${base}/q/${esc(id)}</a><br>
Their full demo website: <a href="/s/${esc(id)}">${base}/s/${esc(id)}</a></p>
</body></html>`);
});

// ---- API ----
app.get("/api/client", (req, res) => {
  const client = getClient(clientIdFromRequest(req));
  if (!client) return res.status(404).json({ error: "Unknown client" });
  res.json({
    id: client.id,
    businessName: client.business_name,
    tagline: client.tagline,
    primaryColor: client.primary_color,
  });
});

app.get("/api/rates", (req, res) => {
  const clientId = clientIdFromRequest(req);
  if (clientId && !getClient(clientId)) {
    return res.status(404).json({ error: "Unknown client" });
  }
  res.json(getRateCard(clientId));
});

app.post("/api/quote", (req, res) => {
  const spec = req.body;
  const clientId = clientIdFromRequest(req);

  if (clientId && !getClient(clientId)) {
    return res.status(404).json({ error: "Unknown client" });
  }

  try {
    const rateCard = getRateCard(clientId);
    const quote = calculateQuote(spec, rateCard);

    logQuote({
      clientId,
      product: spec.product,
      spec,
      low: quote.low,
      high: quote.high,
      customerName: spec.customerName,
      customerPhone: spec.customerPhone,
      customerEmail: spec.customerEmail,
    });

    res.json(quote);
  } catch (err) {
    // Bad input (unknown product, missing field) — not a server failure.
    res.status(400).json({ error: err.message });
  }
});

// ---- "Get started" requests from the InstaQuote sales website ----
const enquiryHits = new Map(); // ip -> recent timestamps (simple spam brake)
const clip = (v, n) => String(v || "").trim().slice(0, n);

app.post("/api/enquiry", (req, res) => {
  const b = req.body || {};

  // Hidden field that real people never fill in: bots do. Pretend it worked.
  if (clip(b.company_site, 200)) return res.json({ ok: true });

  const now = Date.now();
  const recent = (enquiryHits.get(req.ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= 5) {
    return res.status(429).json({ error: "Too many requests. Please try again later or contact us on WhatsApp." });
  }

  const name = clip(b.name, 100);
  const phone = clip(b.phone, 30);
  const email = clip(b.email, 120);
  if (!name) return res.status(400).json({ error: "Please enter your name." });
  if (!phone && !email) return res.status(400).json({ error: "Please enter a phone number or an email address so we can reach you." });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "That email address doesn't look right." });
  }

  recent.push(now);
  enquiryHits.set(req.ip, recent);

  logEnquiry({
    name, phone, email,
    business: clip(b.business, 120),
    plan: clip(b.plan, 60),
    message: clip(b.message, 1000),
  });
  console.log("NEW ENQUIRY:", name, phone || email);
  res.json({ ok: true });
});

// ---- Private admin page: enquiries and quote leads in plain tables ----
function adminAllowed(req) {
  const key = process.env.ADMIN_KEY;
  return key && req.query.key === key;
}
app.get("/admin", (req, res) => {
  if (!adminAllowed(req)) {
    return res.status(403).send("Not allowed. Add a variable called ADMIN_KEY on Railway, then open /admin?key=YOUR_PASSWORD");
  }
  const cell = (v) => `<td>${esc(v == null ? "" : v)}</td>`;
  const enq = listEnquiries(100)
    .map((e) => `<tr>${cell(e.created_at)}${cell(e.name)}${cell(e.business)}${cell(e.phone)}${cell(e.email)}${cell(e.plan)}${cell(e.message)}</tr>`)
    .join("") || '<tr><td colspan="7">No enquiries yet.</td></tr>';
  const leads = listRecentQuotes(100)
    .map((q) => `<tr>${cell(q.created_at)}${cell(q.client_id || "(default)")}${cell(q.customer_name)}${cell(q.customer_phone)}${cell(q.product)}${cell("R" + q.low + " to R" + q.high)}</tr>`)
    .join("") || '<tr><td colspan="6">No quote requests yet.</td></tr>';
  res.type("html").send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>InstaQuote admin</title>
<style>body{font-family:Segoe UI,system-ui,sans-serif;margin:0;padding:24px;background:#f5f2ec;color:#172126}
h1,h2{font-family:Georgia,serif}table{border-collapse:collapse;width:100%;background:#fff;font-size:.92rem}
th,td{border:1px solid #ddd7cb;padding:8px 10px;text-align:left;vertical-align:top}th{background:#101a1e;color:#fff}
.wrap{overflow-x:auto;margin-bottom:32px}</style></head><body>
<h1>InstaQuote admin</h1>
<h2>Sales enquiries (people who want InstaQuote)</h2>
<div class="wrap"><table><tr><th>Time (UTC)</th><th>Name</th><th>Business</th><th>Phone</th><th>Email</th><th>Plan</th><th>Message</th></tr>${enq}</table></div>
<h2>Quote requests from customers (all clients)</h2>
<div class="wrap"><table><tr><th>Time (UTC)</th><th>Client</th><th>Name</th><th>Phone</th><th>Product</th><th>Estimate</th></tr>${leads}</table></div>
</body></html>`);
});

// The quote log contains customer names and phone numbers, so it is private.
// To use it, add a variable called ADMIN_KEY on Railway (any long password),
// then open /api/quotes?key=YOUR_PASSWORD
app.get("/api/quotes", (req, res) => {
  const key = process.env.ADMIN_KEY;
  if (!key || req.query.key !== key) {
    return res.status(403).json({ error: "Not allowed" });
  }
  res.json(listRecentQuotes(50, req.query.client));
});

// Static files last, and never as the home page (so an old index.html
// left in the public folder cannot hide the client website).
app.use(express.static(PUBLIC_DIR, { index: false }));

app.listen(PORT, () => {
  console.log(`InstaQuote server running at http://localhost:${PORT}`);
});
