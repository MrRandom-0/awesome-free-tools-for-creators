"use strict";

// Awesome Free Tools for Creators — companion site.
// Loads tools.json (a copy of the repo's tools.json, generated next to this
// file by scripts/build.mjs) and renders a searchable, filterable card list.
// No framework, no build step, no tracking.

// Category order and titles mirror scripts/categories.mjs in the repo root.
// If a category is ever renamed, change it in both places.
const CATEGORIES = [
  { id: "video", title: "Video & Animation" },
  { id: "audio", title: "Audio & Music" },
  { id: "design", title: "Design & Images" },
  { id: "writing", title: "Writing & Blogging" },
  { id: "seo-marketing", title: "SEO & Marketing" },
  { id: "social", title: "Social Media" },
  { id: "productivity", title: "Productivity" },
  { id: "ai", title: "AI Tools" },
  { id: "learning", title: "Learning" },
];
const titleFor = (id) => (CATEGORIES.find((c) => c.id === id) || {}).title || id;

const state = { tools: [], query: "", category: "all" };

const $list = document.getElementById("list");
const $empty = document.getElementById("empty");
const $error = document.getElementById("error");
const $count = document.getElementById("count");
const $chips = document.getElementById("chips");
const $search = document.getElementById("search");
const $stats = document.getElementById("stats");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderChips() {
  $chips.textContent = "";
  const counts = new Map();
  for (const tool of state.tools) counts.set(tool.category, (counts.get(tool.category) || 0) + 1);

  const makeChip = (id, label, n) => {
    const chip = el("button", "chip");
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(state.category === id));
    chip.append(document.createTextNode(label + " "));
    chip.append(el("span", "n", String(n)));
    chip.addEventListener("click", () => {
      state.category = id;
      renderChips();
      renderList();
    });
    return chip;
  };

  $chips.append(makeChip("all", "All", state.tools.length));
  for (const cat of CATEGORIES) {
    if (counts.has(cat.id)) $chips.append(makeChip(cat.id, cat.title, counts.get(cat.id)));
  }
}

function matches(tool) {
  if (state.category !== "all" && tool.category !== state.category) return false;
  if (!state.query) return true;
  const haystack = [tool.name, tool.description, tool.freeNote, titleFor(tool.category), ...(tool.tags || [])]
    .join(" ")
    .toLowerCase();
  return state.query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function renderList() {
  const visible = state.tools.filter(matches);
  $list.textContent = "";

  for (const tool of visible) {
    const card = el("article", "card");

    const cat = el("p", "cat", titleFor(tool.category));
    const h = el("h2");
    const link = el("a", "", tool.name);
    link.href = tool.url;
    link.target = "_blank";
    link.rel = "noopener";
    h.append(link);

    const desc = el("p", "desc", tool.description);
    const free = el("p", "free", "Free: " + tool.freeNote);
    card.append(cat, h, desc, free);

    if (tool.tags && tool.tags.length) {
      card.append(el("p", "tags", tool.tags.map((t) => "#" + t).join("  ")));
    }
    $list.append(card);
  }

  $empty.hidden = visible.length !== 0;
  $count.textContent =
    visible.length === state.tools.length
      ? `Showing all ${visible.length} tools.`
      : `Showing ${visible.length} of ${state.tools.length} tools.`;
}

$search.addEventListener("input", () => {
  state.query = $search.value.trim();
  renderList();
});

// Support ?q= and ?category= deep links, handy for sharing a filtered view.
const params = new URLSearchParams(location.search);
if (params.get("q")) {
  state.query = params.get("q");
  $search.value = state.query;
}
if (params.get("category")) state.category = params.get("category");

fetch("tools.json")
  .then((res) => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then((tools) => {
    state.tools = tools;
    renderChips();
    renderList();
    if ($stats) {
      const cats = new Set(tools.map((t) => t.category)).size;
      $stats.textContent = `${tools.length} tools · ${cats} categories · re-checked monthly`;
    }
  })
  .catch(() => {
    $error.hidden = false;
    $count.textContent = "";
  });
