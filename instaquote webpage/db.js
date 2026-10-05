/**
 * Database layer — SQLite via Node's built-in node:sqlite module.
 *
 * Tables:
 *   rates          — the default rate card (one row per product type)
 *   multipliers    — finish / glazing / access options for the default card
 *   clients        — one row per client business, filled from the clients/ folder
 *   quote_requests — a log of every quote generated, for follow-up and analysis
 *   enquiries      — "get started" requests from the InstaQuote sales website
 *
 * MULTI-CLIENT: every client starts from the default rate card above.
 * A client can override any price in its "overrides_json" column, e.g.
 *   {"rates":{"window":2100},"finish":{"mill":0.9}}
 * Anything not overridden uses the default (average) price.
 *
 * This file is the ONLY place that talks to the database.
 */

const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new DatabaseSync(path.join(DATA_DIR, "instaquote.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS rates (
    product       TEXT PRIMARY KEY,
    unit          TEXT NOT NULL,          -- 'area' or 'length'
    base_rate     REAL NOT NULL,          -- R per m² or R per metre
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS multipliers (
    category      TEXT NOT NULL,          -- 'finish', 'glazing', 'access'
    key           TEXT NOT NULL,          -- e.g. 'mill', 'double', 'upper'
    value         REAL NOT NULL,          -- multiplier or R/m² addon
    PRIMARY KEY (category, key)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id             TEXT PRIMARY KEY,      -- used in the link, e.g. 'glass-right'
    business_name  TEXT NOT NULL,
    tagline        TEXT,
    primary_color  TEXT NOT NULL DEFAULT '#0f6b72',
    notify_email   TEXT,
    overrides_json TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS enquiries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    name        TEXT NOT NULL,
    business    TEXT,
    phone       TEXT,
    email       TEXT,
    plan        TEXT,
    message     TEXT
  );

  CREATE TABLE IF NOT EXISTS quote_requests (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    product       TEXT NOT NULL,
    spec_json     TEXT NOT NULL,          -- full input spec, for audit/debugging
    low            INTEGER NOT NULL,
    high           INTEGER NOT NULL,
    customer_name  TEXT,
    customer_phone TEXT,
    customer_email TEXT
  );
`);

// Older databases don't have the client_id column yet — add it once.
const quoteCols = db.prepare("PRAGMA table_info(quote_requests)").all();
if (!quoteCols.some((c) => c.name === "client_id")) {
  db.exec("ALTER TABLE quote_requests ADD COLUMN client_id TEXT");
}

// Seed the rate card with the Gauteng market averages, but only if the
// table is empty — this never overwrites rates someone has since edited.
const seedRates = [
  { product: "window",     unit: "area",   base_rate: 1900 },
  { product: "door",       unit: "area",   base_rate: 2200 },
  { product: "shopfront",  unit: "area",   base_rate: 3400 },
  { product: "balustrade", unit: "length", base_rate: 1300 },
  { product: "carport",    unit: "area",   base_rate: 1400 },
];

const seedMultipliers = [
  { category: "finish",  key: "mill",      value: 0.88 },
  { category: "finish",  key: "powder",    value: 1.0 },
  { category: "finish",  key: "anodized",  value: 1.15 },
  { category: "glazing", key: "none",      value: 0 },
  { category: "glazing", key: "single",    value: 350 },
  { category: "glazing", key: "double",    value: 900 },
  { category: "access",  key: "easy",      value: 1.0 },
  { category: "access",  key: "upper",     value: 1.18 },
  { category: "access",  key: "difficult", value: 1.30 },
];

const rateCount = db.prepare("SELECT COUNT(*) AS n FROM rates").get().n;
if (rateCount === 0) {
  const insertRate = db.prepare(
    "INSERT INTO rates (product, unit, base_rate) VALUES (@product, @unit, @base_rate)"
  );
  db.exec("BEGIN");
  for (const r of seedRates) insertRate.run(r);
  db.exec("COMMIT");
}

const multCount = db.prepare("SELECT COUNT(*) AS n FROM multipliers").get().n;
if (multCount === 0) {
  const insertMult = db.prepare(
    "INSERT INTO multipliers (category, key, value) VALUES (@category, @key, @value)"
  );
  db.exec("BEGIN");
  for (const r of seedMultipliers) insertMult.run(r);
  db.exec("COMMIT");
}

/**
 * Copies every client file (clients/*.json) into the clients table.
 * The files are the source of truth, so editing a file and redeploying
 * updates that client's name, colour and prices.
 */
function syncClients(clientFiles) {
  const upsert = db.prepare(
    `INSERT INTO clients (id, business_name, tagline, primary_color, notify_email, overrides_json)
     VALUES (@id, @business_name, @tagline, @primary_color, @notify_email, @overrides_json)
     ON CONFLICT(id) DO UPDATE SET
       business_name = excluded.business_name,
       tagline = excluded.tagline,
       primary_color = excluded.primary_color,
       notify_email = excluded.notify_email,
       overrides_json = excluded.overrides_json`
  );
  for (const c of Object.values(clientFiles)) {
    upsert.run({
      id: c.id,
      business_name: c.businessName,
      tagline: c.tagline || null,
      primary_color: (c.colors && c.colors.brand) || "#1f7a8c",
      notify_email: c.notifyEmail || null,
      overrides_json: JSON.stringify(c.pricing || {}),
    });
  }
}

/** Returns one client's details, or null if that client doesn't exist. */
function getClient(clientId) {
  if (!clientId) return null;
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(clientId);
  return row || null;
}

/**
 * Returns the rate card in the shape pricing-engine.js expects.
 * With no clientId you get the default (average) card, exactly as before.
 * With a clientId, that client's overrides are applied on top.
 */
function getRateCard(clientId) {
  const rates = {};
  for (const row of db.prepare("SELECT * FROM rates").all()) {
    rates[row.product] = { base: row.base_rate, unit: row.unit };
  }

  const finish = {}, glazing = {}, access = {};
  for (const row of db.prepare("SELECT * FROM multipliers").all()) {
    if (row.category === "finish") finish[row.key] = row.value;
    if (row.category === "glazing") glazing[row.key] = row.value;
    if (row.category === "access") access[row.key] = row.value;
  }

  const card = { rates, finish, glazing, access };

  const client = getClient(clientId);
  if (client) {
    let o = {};
    try { o = JSON.parse(client.overrides_json || "{}"); } catch (e) {}
    for (const [product, base] of Object.entries(o.rates || {})) {
      if (card.rates[product]) card.rates[product].base = base;
    }
    Object.assign(card.finish, o.finish || {});
    Object.assign(card.glazing, o.glazing || {});
    Object.assign(card.access, o.access || {});
  }

  return card;
}

/** Updates a single product's base rate on the default card. */
function updateRate(product, baseRate) {
  db.prepare(
    "UPDATE rates SET base_rate = ?, updated_at = datetime('now') WHERE product = ?"
  ).run(baseRate, product);
}

/** Logs a generated quote so the company can follow up. */
function logQuote({ clientId, product, spec, low, high, customerName, customerPhone, customerEmail }) {
  db.prepare(
    `INSERT INTO quote_requests (client_id, product, spec_json, low, high, customer_name, customer_phone, customer_email)
     VALUES (@client_id, @product, @spec_json, @low, @high, @customer_name, @customer_phone, @customer_email)`
  ).run({
    client_id: clientId || null,
    product,
    spec_json: JSON.stringify(spec),
    low,
    high,
    customer_name: customerName || null,
    customer_phone: customerPhone || null,
    customer_email: customerEmail || null,
  });
}

function listRecentQuotes(limit = 50, clientId) {
  if (clientId) {
    return db
      .prepare("SELECT * FROM quote_requests WHERE client_id = ? ORDER BY id DESC LIMIT ?")
      .all(clientId, limit);
  }
  return db.prepare("SELECT * FROM quote_requests ORDER BY id DESC LIMIT ?").all(limit);
}

/** Saves a "get started" request from the InstaQuote sales website. */
function logEnquiry({ name, business, phone, email, plan, message }) {
  db.prepare(
    `INSERT INTO enquiries (name, business, phone, email, plan, message)
     VALUES (@name, @business, @phone, @email, @plan, @message)`
  ).run({
    name,
    business: business || null,
    phone: phone || null,
    email: email || null,
    plan: plan || null,
    message: message || null,
  });
}

function listEnquiries(limit = 100) {
  return db.prepare("SELECT * FROM enquiries ORDER BY id DESC LIMIT ?").all(limit);
}

module.exports = { getRateCard, getClient, syncClients, updateRate, logQuote, listRecentQuotes, logEnquiry, listEnquiries };
