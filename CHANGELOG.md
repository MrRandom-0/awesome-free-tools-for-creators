# Changelog

All notable changes to the list and the tooling around it. Entry counts are
the total tools listed at the time of the change.

## [Unreleased]

_Nothing yet. Monthly maintenance notes land here — see MAINTENANCE.md._

## [1.0.0] — 2026-11-06

First public version.

- 99 tools across 9 categories: Video & Animation (12), Audio & Music (8),
  Design & Images (12), Writing & Blogging (10), SEO & Marketing (12),
  Social Media (10), Productivity (12), AI Tools (12), Learning (11).
- `tools.json` established as the single source of truth, with a validator
  (`scripts/validate.mjs`) for structure, duplicates and style.
- README and companion website generated from `tools.json` by
  `scripts/build.mjs`; CI rejects out-of-sync changes.
- Companion site in `docs/`: search, category filters, system dark/light.
- Monthly automated link checking (`scripts/check-links.mjs`) with a
  dead/redirected/blocked report.
- Maintenance runbook (`MAINTENANCE.md`): monthly rhythm, PR Tuesdays,
  rotating free-tier re-verification.
