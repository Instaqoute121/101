/**
 * Loads every client file from the "clients" folder.
 * One file = one client. Files starting with "_" (like _template.json) are
 * ignored, so you can keep a blank template there.
 */
const fs = require("fs");
const path = require("path");

const CLIENTS_DIR = path.join(__dirname, "clients");

function loadClientFiles() {
  const clients = {};
  if (!fs.existsSync(CLIENTS_DIR)) return clients;

  for (const file of fs.readdirSync(CLIENTS_DIR)) {
    if (!file.endsWith(".json") || file.startsWith("_")) continue;
    try {
      const text = fs.readFileSync(path.join(CLIENTS_DIR, file), "utf8");
      if (!text.trim()) throw new Error("the file is empty (re-upload it to GitHub)");
      const config = JSON.parse(text);
      const id = String(config.id || file.replace(/\.json$/, "")).toLowerCase();
      if (!/^[a-z0-9-]+$/.test(id)) throw new Error('"id" may only use a-z, 0-9 and dashes');
      if (!config.businessName) throw new Error('"businessName" is missing');
      config.id = id;
      clients[id] = config;
    } catch (err) {
      // One broken file must never stop the other clients from working.
      console.error(`Skipping clients/${file}: ${err.message}`);
    }
  }
  return clients;
}

module.exports = { loadClientFiles };
