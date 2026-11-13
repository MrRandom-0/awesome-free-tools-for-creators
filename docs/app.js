"use strict";

// Awesome Free Tools for Creators — companion site.
// Loads tools.json (a copy of the repo's tools.json, generated next to this
// file by scripts/build.mjs) and renders a searchable, sortable, filterable
// card list. Visitors can star favourites (kept in localStorage, on this
// device only) and share a link to any view — the search, category,
// favourites-only toggle and sort order all live in the URL hash.
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

const SORTS = ["curated", "az", "za"];
const FAV_KEY = "aftc:favourites:v1";

// One star path, used by the card buttons and the Favourites chip.
// (A fixed literal — innerHTML here never carries user or data input.)
const STAR_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.13 5.11a.56.56 0 0 0 .47.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 0 0-.18.56l1.28 5.38a.56.56 0 0 1-.84.61l-4.72-2.88a.56.56 0 0 0-.59 0l-4.72 2.88a.56.56 0 0 1-.84-.61l1.29-5.38a.56.56 0 0 0-.19-.56l-4.2-3.6a.56.56 0 0 1 .32-.99l5.52-.44a.56.56 0 0 0 .47-.35L11.48 3.5Z"/></svg>';

function loadFavourites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function saveFavourites() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...state.favourites]));
  } catch {
    // Storage can be unavailable (private mode, quotas) — favourites then
    // simply last for the session instead of across visits.
  }
}

const state = {
  tools: [],
  query: "",
  category: "all",
  sort: "curated",
  favsOnly: false,
  favourites: loadFavourites(),
};

const $list = document.getElementById("list");
const $empty = document.getElementById("empty");
const $error = document.getElementById("error");
const $count = document.getElementById("count");
const $chips = document.getElementById("chips");
const $search = document.getElementById("search");
const $sort = document.getElementById("sort");
const $stats = document.getElementById("stats");
const EMPTY_DEFAULT = $empty.innerHTML;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ---------- URL hash state ---------- */

function syncHash() {
  const p = new URLSearchParams();
  if (state.query) p.set("q", state.query);
  if (state.category !== "all") p.set("cat", state.category);
  if (state.favsOnly) p.set("fav", "1");
  if (state.sort !== "curated") p.set("sort", state.sort);
  const hash = p.toString() ? "#" + p.toString() : "";
  if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname);
}

function hashParams() {
  if (!location.hash || location.hash.length < 2) return null;
  const p = new URLSearchParams(location.hash.slice(1));
  return ["q", "cat", "fav", "sort"].some((k) => p.has(k)) ? p : null;
}

function applyParams(p) {
  state.query = (p.get("q") || "").trim();
  const cat = p.get("cat");
  state.category = CATEGORIES.some((c) => c.id === cat) ? cat : "all";
  state.favsOnly = p.get("fav") === "1";
  const sort = p.get("sort");
  state.sort = SORTS.includes(sort) ? sort : "curated";
}

function reflectControls() {
  $search.value = state.query;
  $sort.value = state.sort;
}

/* ---------- Rendering ---------- */

function renderChips() {
  $chips.textContent = "";
  const counts = new Map();
  for (const tool of state.tools) counts.set(tool.category, (counts.get(tool.category) || 0) + 1);

  const favChip = el("button", "chip fav-chip");
  favChip.type = "button";
  favChip.setAttribute("aria-pressed", String(state.favsOnly));
  favChip.innerHTML = STAR_SVG;
  favChip.append(document.createTextNode("Favourites "));
  favChip.append(el("span", "n", String(state.favourites.size)));
  favChip.addEventListener("click", () => {
    state.favsOnly = !state.favsOnly;
    syncHash();
    renderChips();
    renderList();
  });
  $chips.append(favChip);

  const makeChip = (id, label, n) => {
    const chip = el("button", "chip");
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(state.category === id));
    chip.append(document.createTextNode(label + " "));
    chip.append(el("span", "n", String(n)));
    chip.addEventListener("click", () => {
      state.category = id;
      syncHash();
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
  if (state.favsOnly && !state.favourites.has(tool.name)) return false;
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

function toggleFavourite(name) {
  if (state.favourites.has(name)) state.favourites.delete(name);
  else state.favourites.add(name);
  saveFavourites();
  renderChips();
  renderList();
}

function renderEmpty(visibleCount) {
  $empty.hidden = visibleCount !== 0;
  if (visibleCount !== 0) return;
  if (state.favsOnly && state.favourites.size === 0) {
    $empty.textContent =
      "No favourites yet. Tap the star on any tool to save it here — favourites are kept on this device only.";
  } else if (state.favsOnly) {
    $empty.textContent =
      "None of your favourites match this view. Try a different search or category — or turn off the Favourites filter.";
  } else {
    $empty.innerHTML = EMPTY_DEFAULT;
  }
}

function renderCount(visibleCount) {
  if (state.favsOnly && state.favourites.size === 0) {
    $count.textContent = "No favourites saved yet.";
  } else if (state.favsOnly) {
    $count.textContent = `Showing ${visibleCount} of your ${state.favourites.size} favourite${
      state.favourites.size === 1 ? "" : "s"
    }.`;
  } else {
    $count.textContent =
      visibleCount === state.tools.length
        ? `Showing all ${visibleCount} tools.`
        : `Showing ${visibleCount} of ${state.tools.length} tools.`;
  }
}

function renderList() {
  const visible = state.tools.filter(matches);
  if (state.sort === "az") visible.sort((a, b) => a.name.localeCompare(b.name, "en"));
  else if (state.sort === "za") visible.sort((a, b) => b.name.localeCompare(a.name, "en"));
  $list.textContent = "";

  for (const tool of visible) {
    const card = el("article", "card");

    const top = el("div", "card-top");
    const cat = el("p", "cat", titleFor(tool.category));
    const isFav = state.favourites.has(tool.name);
    const star = el("button", "star-btn");
    star.type = "button";
    star.setAttribute("aria-pressed", String(isFav));
    star.setAttribute(
      "aria-label",
      isFav ? `Remove ${tool.name} from favourites` : `Save ${tool.name} to favourites`
    );
    star.title = isFav ? "Remove from favourites" : "Save to favourites";
    star.innerHTML = STAR_SVG;
    star.addEventListener("click", () => toggleFavourite(tool.name));
    top.append(cat, star);

    const h = el("h2");
    const link = el("a", "", tool.name);
    link.href = tool.url;
    link.target = "_blank";
    link.rel = "noopener";
    h.append(link);

    const desc = el("p", "desc", tool.description);
    const free = el("p", "free", "Free: " + tool.freeNote);
    card.append(top, h, desc, free);

    if (tool.tags && tool.tags.length) {
      card.append(el("p", "tags", tool.tags.map((t) => "#" + t).join("  ")));
    }
    $list.append(card);
  }

  renderEmpty(visible.length);
  renderCount(visible.length);
}

/* ---------- Events ---------- */

$search.addEventListener("input", () => {
  state.query = $search.value.trim();
  syncHash();
  renderList();
});

$sort.addEventListener("change", () => {
  state.sort = $sort.value;
  syncHash();
  renderList();
});

// "/" jumps to the search box from anywhere outside a form field.
document.addEventListener("keydown", (e) => {
  if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
  e.preventDefault();
  $search.focus();
  $search.select();
});

// Follow hash edits and pasted links while the page is open.
window.addEventListener("hashchange", () => {
  applyParams(hashParams() || new URLSearchParams());
  reflectControls();
  renderChips();
  renderList();
});

/* ---------- Initial state ---------- */

// Shareable state lives in the hash (#q=…&cat=…&fav=1&sort=az). The older
// ?q= / ?category= query links still work as a starting point.
const initialHash = hashParams();
if (initialHash) {
  applyParams(initialHash);
} else {
  const params = new URLSearchParams(location.search);
  if (params.get("q") || params.get("category")) {
    const p = new URLSearchParams();
    if (params.get("q")) p.set("q", params.get("q"));
    if (params.get("category")) p.set("cat", params.get("category"));
    applyParams(p);
  }
}
reflectControls();

fetch("tools.json")
  .then((res) => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then((tools) => {
    state.tools = tools;
    // Drop saved favourites whose tool has left the list since.
    const names = new Set(tools.map((t) => t.name));
    let pruned = false;
    for (const name of [...state.favourites]) {
      if (!names.has(name)) {
        state.favourites.delete(name);
        pruned = true;
      }
    }
    if (pruned) saveFavourites();
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
