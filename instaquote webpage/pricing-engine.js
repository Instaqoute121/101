/**
 * Pricing engine. Pure maths: takes what the customer entered plus a
 * rate card, returns a price range. It never touches the database.
 *
 * Area products   : price = ((area x base rate x finish) + (glazing x area)) x access
 * Length products : price = (length x base rate x finish) x access
 * Then multiplied by quantity and shown as a range (about +/- 8%).
 */

const RANGE = 0.08;

function num(value, label, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
  return n;
}

function pick(group, key, label) {
  if (!group || !Object.prototype.hasOwnProperty.call(group, key)) {
    throw new Error(`Please choose a valid ${label}.`);
  }
  return group[key];
}

function roundTo10(n) {
  return Math.round(n / 10) * 10;
}

function calculateQuote(spec, card) {
  if (!spec || typeof spec !== "object") throw new Error("Missing quote details.");

  const product = card.rates[spec.product];
  if (!product) throw new Error("Please choose a product.");

  const quantity = Math.floor(num(spec.quantity ?? 1, "Quantity", 1, 100));
  const finish = pick(card.finish, spec.finish, "finish");
  const access = pick(card.access, spec.access, "access level");

  let perItem;
  let detail;

  if (product.unit === "length") {
    const lengthM = num(spec.lengthMm, "Length (mm)", 300, 50000) / 1000;
    perItem = lengthM * product.base * finish * access;
    detail = { lengthM: Number((lengthM * quantity).toFixed(2)) };
  } else {
    const widthM = num(spec.widthMm, "Width (mm)", 100, 6000) / 1000;
    const heightM = num(spec.heightMm, "Height (mm)", 100, 6000) / 1000;
    const area = widthM * heightM;
    const glazing = pick(card.glazing, spec.glazing ?? "none", "glazing option");
    perItem = (area * product.base * finish + glazing * area) * access;
    detail = { areaM2: Number((area * quantity).toFixed(2)) };
  }

  const total = perItem * quantity;
  return {
    low: roundTo10(total * (1 - RANGE)),
    high: roundTo10(total * (1 + RANGE)),
    detail,
  };
}

module.exports = { calculateQuote };
