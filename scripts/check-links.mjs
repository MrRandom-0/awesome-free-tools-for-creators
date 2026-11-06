#!/usr/bin/env node
// Zero-dependency link checker for tools.json.
//
// For every entry URL it makes a request with a browser-like user agent,
// follows redirects, and classifies the result:
//   ok        2xx after redirects
//   redirect  ended on a different host/path than the one listed
//             (not a failure, but worth a human look — usually the tool
//             moved, was renamed, or the URL should be updated)
//   blocked   401 / 403 / 429 or any other 4xx — the site answered but
//             refused the checker; verify in a browser before acting
//   dead      network error or timeout (after one retry), 404 / 410, or 5xx
//
// Only "dead" results make the process exit non-zero, so CI fails on
// genuinely broken links without crying wolf over bot protection.
//
// Usage:
//   node scripts/check-links.mjs               # full list
//   node scripts/check-links.mjs --limit 20    # first 20 entries
//   node scripts/check-links.mjs --only Canva  # entries matching a name
//   node scripts/check-links.mjs --timeout 15  # per-request seconds
//   node scripts/check-links.mjs --report link-report.md
//
// Concurrency is deliberately small (5) to stay polite.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const limit = Number(opt("limit", "0")) || 0;
const only = (opt("only", "") || "").toLowerCase();
const timeoutMs = (Number(opt("timeout", "15")) || 15) * 1000;
const reportPath = opt("report", "");

let tools = JSON.parse(readFileSync(join(root, "tools.json"), "utf8"));
if (only) tools = tools.filter((t) => t.name.toLowerCase().includes(only));
if (limit > 0) tools = tools.slice(0, limit);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function attempt(tool) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res = await fetch(tool.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,*/*" },
    });
    // We only need the status; cancel the body so large homepages are not
    // downloaded in full. Some servers dislike cancelled bodies on HEAD-less
    // GETs, but by this point the status is already known.
    try {
      await res.body?.cancel();
    } catch {
      /* ignore */
    }
    const finalUrl = res.url || tool.url;
    if (res.status === 404 || res.status === 410) {
      return { tool, kind: "dead", detail: `HTTP ${res.status}` };
    }
    if (res.status >= 500) {
      return { tool, kind: "dead", detail: `HTTP ${res.status}` };
    }
    if (res.status === 401 || res.status === 403 || res.status === 429) {
      return { tool, kind: "blocked", detail: `HTTP ${res.status} (bot protection?)` };
    }
    if (res.status >= 200 && res.status < 300) {
      const listed = new URL(tool.url);
      const landed = new URL(finalUrl);
      if (listed.hostname !== landed.hostname) {
        return { tool, kind: "redirect", detail: `now lands on ${landed.hostname}${landed.pathname}` };
      }
      return { tool, kind: "ok", detail: `HTTP ${res.status}` };
    }
    if (res.status >= 300 && res.status < 400) {
      return { tool, kind: "redirect", detail: `HTTP ${res.status}, final: ${finalUrl}` };
    }
    // Any other 4xx (400, 405, 418, ...) usually means the site answered but
    // refused the checker — treat it like bot protection, not death.
    return { tool, kind: "blocked", detail: `HTTP ${res.status} (verify in a browser)` };
  } catch (err) {
    const reason =
      err.name === "AbortError" ? `timed out after ${timeoutMs / 1000}s` : err.cause?.code || err.message;
    return { tool, kind: "dead", detail: String(reason), networkError: true };
  } finally {
    clearTimeout(timer);
  }
}

async function check(tool) {
  // One retry for network-level failures only (timeouts, socket errors):
  // a single dropped connection should not mark a healthy site dead.
  // HTTP results are never retried — the server already gave its answer.
  const first = await attempt(tool);
  if (!first.networkError) return first;
  const second = await attempt(tool);
  if (!second.networkError) return second;
  return { ...second, detail: `${second.detail} (after 1 retry)` };
}

const results = [];
const CONCURRENCY = 5;
let cursor = 0;
async function worker() {
  while (cursor < tools.length) {
    const tool = tools[cursor++];
    const result = await check(tool);
    results.push(result);
    const mark = { ok: "ok  ", redirect: "redir", blocked: "block", dead: "DEAD" }[result.kind];
    console.log(`[${mark}] ${tool.name} — ${result.detail}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const by = (kind) => results.filter((r) => r.kind === kind);
const summary = {
  checked: results.length,
  ok: by("ok").length,
  redirect: by("redirect").length,
  blocked: by("blocked").length,
  dead: by("dead").length,
};
console.log(
  `\nChecked ${summary.checked}: ${summary.ok} ok, ${summary.redirect} redirected, ` +
    `${summary.blocked} blocked, ${summary.dead} dead.`
);

if (reportPath) {
  const section = (title, list) =>
    list.length
      ? [`### ${title} (${list.length})`, "", ...list.map((r) => `- **${r.tool.name}** — ${r.tool.url} — ${r.detail}`), ""]
      : [];
  const md = [
    "# Link check report",
    "",
    `Checked ${summary.checked} links: ${summary.ok} ok, ${summary.redirect} redirected, ${summary.blocked} blocked, ${summary.dead} dead.`,
    "",
    ...section("Dead — remove or fix", by("dead")),
    ...section("Redirected — review the listed URL", by("redirect")),
    ...section("Blocked — verify in a browser", by("blocked")),
  ].join("\n");
  writeFileSync(reportPath, md, "utf8");
  console.log(`Report written to ${reportPath}`);
}

process.exit(summary.dead > 0 ? 1 : 0);
