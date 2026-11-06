#!/usr/bin/env node
// Generates README.md and docs/tools.json from tools.json.
//
// Contributors only ever edit tools.json; everything else is built here.
// The README deliberately uses a plain list format (no tables, no images
// inside layout tricks) so it renders the same on github.com, in the
// GitHub mobile app, and everywhere else markdown is rendered.
//
// Usage: node scripts/build.mjs
// Output is deterministic: running it twice produces byte-identical files.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CATEGORIES } from "./categories.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tools = JSON.parse(readFileSync(join(root, "tools.json"), "utf8"));

const byCategory = new Map(CATEGORIES.map((c) => [c.id, []]));
for (const tool of tools) {
  if (!byCategory.has(tool.category)) {
    console.error(`Unknown category "${tool.category}" on entry "${tool.name}".`);
    console.error("Fix tools.json or add the category in scripts/categories.mjs.");
    process.exit(1);
  }
  byCategory.get(tool.category).push(tool);
}
// Stable, alphabetical order inside each category — diff-friendly.
for (const list of byCategory.values()) {
  list.sort((a, b) => a.name.localeCompare(b.name, "en"));
}

const count = tools.length;
const anchor = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const lines = [];
lines.push("# Awesome Free Tools for Creators");
lines.push("");
lines.push(
  "A curated list of genuinely free tools for people who make things — video, audio, design, writing, marketing and more. Every tool here has a usable free tier you can keep using. No trials that expire, no \"free\" plans that are just demos."
);
lines.push("");
lines.push(
  `[![Entries](https://img.shields.io/badge/tools-${count}-brightgreen)](tools.json) ` +
    "[![License: MIT](https://img.shields.io/badge/licence-MIT-yellow.svg)](LICENSE) " +
    "[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)"
);
lines.push("");
lines.push("**How this list stays honest**");
lines.push("");
lines.push(
  "- Every entry names what the free tier actually gives you, in the _Free:_ note. If a plan shrinks, the note gets fixed or the tool gets removed."
);
lines.push(
  "- Short free trials do not count. Neither do free plans so limited you cannot finish a real piece of work."
);
lines.push("- No affiliate links, ever. Every URL goes straight to the tool itself.");
lines.push(
  "- Entries live in [`tools.json`](tools.json) and this README is generated from it, so the list and the searchable website can never drift apart."
);
lines.push("");
lines.push(
  "**Browse it as a website:** open the companion site in [`docs/`](docs/) (or the GitHub Pages deployment) to search and filter the whole list."
);
lines.push("");
lines.push("## Contents");
lines.push("");
for (const cat of CATEGORIES) {
  const n = byCategory.get(cat.id).length;
  lines.push(`- [${cat.title}](#${anchor(cat.title)}) (${n})`);
}
lines.push("- [Suggest a tool](#suggest-a-tool)");
lines.push("- [Curation rules](#curation-rules)");
lines.push("- [Contributing](#contributing)");
lines.push("- [Licence](#licence)");
lines.push("");

for (const cat of CATEGORIES) {
  const list = byCategory.get(cat.id);
  if (list.length === 0) continue;
  lines.push(`## ${cat.title}`);
  lines.push("");
  lines.push(cat.blurb);
  lines.push("");
  for (const tool of list) {
    lines.push(`- [${tool.name}](${tool.url}) — ${tool.description} _Free: ${tool.freeNote}._`);
  }
  lines.push("");
}

lines.push("## Suggest a tool");
lines.push("");
lines.push(
  "Open an issue with the **Suggest a tool** template, or send a pull request that adds one entry to `tools.json`. Read [CONTRIBUTING.md](CONTRIBUTING.md) first — the criteria are strict on purpose, and one-tool-per-PR keeps reviews fast."
);
lines.push("");
lines.push("## Curation rules");
lines.push("");
lines.push("A tool belongs on this list only if **all** of these are true:");
lines.push("");
lines.push("1. **The free tier is real.** You can finish actual work with it and keep using it indefinitely. Trials, one-off credit packs and demo modes do not count.");
lines.push("2. **The limits are stated honestly.** If exports are watermarked, resolution-capped or credit-limited, the _Free:_ note says so.");
lines.push("3. **It is useful to creators, students or freelancers** — the common person test: would someone making videos, posts, music or a small business plausibly use this weekly?");
lines.push("4. **The link is direct.** Official site only. No affiliate codes, no referral parameters, no link shorteners.");
lines.push("5. **It is still alive.** Actively maintained, reachable, and the free tier still exists (checked monthly by automation — see [MAINTENANCE.md](MAINTENANCE.md)).");
lines.push("");
lines.push("Tools are removed when the free tier disappears, the site dies, or the free plan becomes too limited to finish real work.");
lines.push("");
lines.push("## Contributing");
lines.push("");
lines.push(
  "See [CONTRIBUTING.md](CONTRIBUTING.md). In short: edit only `tools.json`, one tool per pull request, and run `node scripts/build.mjs` — CI will reject a README that is out of sync with `tools.json`."
);
lines.push("");
lines.push("## Licence");
lines.push("");
lines.push(
  "The list content and code in this repository are released under the [MIT Licence](LICENSE). Tool names and logos belong to their respective owners; this list is not affiliated with or endorsed by any of them."
);
lines.push("");

writeFileSync(join(root, "README.md"), lines.join("\n"), "utf8");

// The companion site in docs/ reads its own copy of the data (GitHub Pages
// cannot fetch ../tools.json from outside the published folder).
writeFileSync(join(root, "docs", "tools.json"), JSON.stringify(tools, null, 2) + "\n", "utf8");

console.log(`Built README.md and docs/tools.json from ${count} entries.`);
