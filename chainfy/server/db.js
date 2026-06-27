// Tiny JSON-file datastore. No native deps, no setup — just a file on disk.
// Fine for a devnet MVP. Swap for Postgres/SQLite when you go to mainnet.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const EMPTY = { store: null, products: [], transactions: [] };

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return JSON.parse(JSON.stringify(EMPTY));
  }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  return data;
}

// Convenience: mutate then persist in one go.
function update(fn) {
  const data = load();
  const result = fn(data);
  save(data);
  return result === undefined ? data : result;
}

module.exports = { load, save, update, EMPTY, DB_PATH };
