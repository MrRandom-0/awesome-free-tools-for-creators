#!/usr/bin/env node
// Validates tools.json, the single source of truth for the list.
//
// Rules enforced:
//   - valid JSON, top-level array
//   - every entry has name, url, description, category, freeNote, tags
//   - names and URLs are unique (case-insensitive)
//   - urls are http(s) URLs
//   - category is one of the fixed set in scripts/categories.mjs
//   - tags is a non-empty array of short lowercase slugs
//   - description and freeNote are plain sentences (no markdown links,
//     no exclamation marks — the list has a no-hype rule)
//
// Usage: node scripts/validate.mjs [path-to-tools.json]
// Exit code 0 = valid, 1 = problems found (each printed on its own line).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CATEGORY_IDS } from "./categories.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2] ?? join(root, "tools.json");

const problems = [];
const fail = (msg) => problems.push(msg);

let tools;
try {
  tools = JSON.parse(readFileSync(file, "utf8"));
} catch (err) {
  console.error(`tools.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(tools)) {
  console.error("tools.json must be a JSON array of tool entries.");
  process.exit(1);
}

const REQUIRED = ["name", "url", "description", "category", "freeNote", "tags"];
const seenNames = new Map();
const seenUrls = new Map();

tools.forEach((tool, i) => {
  const where = `entry #${i + 1} (${tool?.name ?? "unnamed"})`;

  for (const field of REQUIRED) {
    if (tool[field] === undefined || tool[field] === "") {
      fail(`${where}: missing field "${field}"`);
    }
  }
  if (typeof tool.name !== "string") return;

  const nameKey = tool.name.trim().toLowerCase();
  if (seenNames.has(nameKey)) {
    fail(`${where}: duplicate name (also entry #${seenNames.get(nameKey) + 1})`);
  }
  seenNames.set(nameKey, i);

  try {
    const u = new URL(tool.url);
    if (!/^https?:$/.test(u.protocol)) fail(`${where}: url must be http(s)`);
    const urlKey = tool.url.trim().toLowerCase().replace(/\/$/, "");
    if (seenUrls.has(urlKey)) {
      fail(`${where}: duplicate url (also entry #${seenUrls.get(urlKey) + 1})`);
    }
    seenUrls.set(urlKey, i);
  } catch {
    fail(`${where}: url is not a valid URL: ${tool.url}`);
  }

  if (!CATEGORY_IDS.includes(tool.category)) {
    fail(`${where}: unknown category "${tool.category}" (allowed: ${CATEGORY_IDS.join(", ")})`);
  }

  if (!Array.isArray(tool.tags) || tool.tags.length === 0) {
    fail(`${where}: tags must be a non-empty array`);
  } else {
    for (const tag of tool.tags) {
      if (typeof tag !== "string" || !/^[a-z0-9-]+$/.test(tag)) {
        fail(`${where}: tag "${tag}" must be a lowercase slug (a-z, 0-9, -)`);
      }
    }
  }

  for (const field of ["description", "freeNote"]) {
    const text = String(tool[field] ?? "");
    if (/!/.test(text)) fail(`${where}: ${field} contains "!" — keep it plain, no hype`);
    if (/\]\(/.test(text)) fail(`${where}: ${field} contains a markdown link — plain text only`);
    if (text.length > 220) fail(`${where}: ${field} is ${text.length} chars — keep it under 220`);
  }
});

if (problems.length > 0) {
  console.error(`tools.json has ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const perCategory = {};
for (const tool of tools) perCategory[tool.category] = (perCategory[tool.category] ?? 0) + 1;
console.log(`tools.json is valid: ${tools.length} entries.`);
for (const id of CATEGORY_IDS) {
  if (perCategory[id]) console.log(`  ${id}: ${perCategory[id]}`);
}
