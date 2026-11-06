# Maintenance runbook

How this list is kept true over time, in about an hour a month. The whole
design goal: **no single heroic effort should ever be needed.** Small,
regular, mostly automated.

## The monthly rhythm

Do these once a month, ideally in the same sitting:

1. **Read the link-check report.** The `Link check` workflow runs on the 1st
   of each month and uploads a report (dead / redirected / blocked). Triage:
   - *Dead* → open the site manually once. Still dead? Remove the entry
     (one PR, or fold it into the monthly batch PR) or fix the URL if the
     tool moved.
   - *Redirected to a different domain* → the tool was renamed, acquired or
     moved. Update the URL (and the name, if it changed) in `tools.json`.
   - *Blocked (403/429)* → usually bot protection, not death. Verify in a
     real browser; only act if a human cannot reach it either.
2. **Merge the PR batch** (see "PR Tuesdays" below).
3. **Re-verify one rotating slice of free tiers** (see below).
4. **Cut a changelog line.** Add the month's additions/removals/note fixes
   to `CHANGELOG.md` under an "Unreleased" heading; tag a release
   (e.g. `v2026.12`) when the batch is merged.

## PR Tuesdays

Contributor PRs are reviewed and merged **in one weekly batch — Tuesdays** —
instead of one at a time as they arrive.

Why: it keeps maintainer time predictable, stops the repo from becoming a
constant background task, and most list PRs are tiny (`tools.json` + build),
so a batch of ten takes minutes with the validator doing the boring checks.

- During the batch: run `npm run validate`, skim each entry against the
  [inclusion criteria](CONTRIBUTING.md#inclusion-criteria), check the
  contributor ran the build, merge.
- Anything contentious (is this free tier real? is this a duplicate niche?)
  gets one clear comment and waits for the next Tuesday rather than a
  long thread.
- New contributors get a friendly first review even if the tool is declined:
  explain which criterion it missed. Today's declined contributor is next
  month's good one.

## Re-verifying free tiers (the rotating slice)

Links staying alive is not enough — free plans shrink quietly. Each month,
pick **one category** (rotate through the nine; each category gets checked
roughly once a quarter at current size) and:

1. Open each tool's official pricing page.
2. Compare it with the entry's `freeNote`.
3. Fix the note, or remove the tool if the free tier is gone or has become
   a trial.

Record the pass in `CHANGELOG.md` ("Re-verified: Video & Animation, Dec
2026 — 2 notes updated"). If a category grows past ~25 entries, check half
of it per month instead.

## How entries get removed

Remove an entry (in `tools.json`, then rebuild) when any of these happen:

- The site is dead, parked, or redirects to something unrelated.
- The free tier is discontinued, converted into a trial, or paywalled
  (exports/saves removed counts as paywalled).
- The free plan still exists but can no longer finish real work
  (e.g. exports capped at a few seconds, or a watermark covering the frame).
- The product was acquired and shut down, or merged into a different tool
  (update the surviving tool's entry instead).
- The tool's `freeNote` can no longer be written truthfully.

Removals are not a judgement on the tool — plenty of good tools simply stop
being free. The list's promise is about *free*, so the list follows the
free tier, not the brand.

Do not remove a tool just because a maintainer personally prefers a rival,
or because of one bad week of downtime — check again next month first.

## Automation already in place

| What | Where | When |
| --- | --- | --- |
| Link check (dead links fail the run) | `.github/workflows/link-check.yml` → `scripts/check-links.mjs` | Monthly (1st), on PRs touching `tools.json`, manual |
| README/site sync + validation | `.github/workflows/readme-sync.yml` → `scripts/validate.mjs` + `scripts/build.mjs` | Every PR and push to `main` |

Both scripts are zero-dependency Node — if the automation ever breaks, a
maintainer can run the same commands locally with nothing to install:

```bash
node scripts/validate.mjs
node scripts/build.mjs
node scripts/check-links.mjs --report link-report.md
```

## Keeping the companion site fresh

The site in `docs/` reads `docs/tools.json`, which `scripts/build.mjs`
regenerates from `tools.json`. Never edit `docs/tools.json` by hand — if it
is stale, the sync workflow fails. GitHub Pages should be set to publish
from the `docs/` folder on `main` (`.nojekyll` is already in place).

## If maintenance lapses

It happens. Recovery order after a quiet spell:

1. Run the link checker locally; remove the dead.
2. Re-verify the two categories most likely to have changed (AI Tools and
   Social Media churn fastest).
3. Process the PR backlog in one Tuesday-style batch.
4. Note the gap honestly in `CHANGELOG.md` and carry on — do not mass-edit
   notes you have not re-checked.
