import fs from 'fs';
import path from 'path';

// Simple JSON-file based override store.
// Lets you manually pin a custom hero photo to a specific match
// when the API doesn't provide one you like.
// Structure: { "<matchId>": { "heroImageUrl": "https://...", "playerName": "..." } }

const DATA_PATH = path.join(process.cwd(), 'data', 'overrides.json');

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, '{}', 'utf-8');
}

export function getAllOverrides() {
  ensureFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getOverride(matchId) {
  const all = getAllOverrides();
  return all[matchId] || null;
}

export function setOverride(matchId, data) {
  ensureFile();
  const all = getAllOverrides();
  all[matchId] = { ...all[matchId], ...data };
  fs.writeFileSync(DATA_PATH, JSON.stringify(all, null, 2), 'utf-8');
  return all[matchId];
}

export function deleteOverride(matchId) {
  ensureFile();
  const all = getAllOverrides();
  delete all[matchId];
  fs.writeFileSync(DATA_PATH, JSON.stringify(all, null, 2), 'utf-8');
}
