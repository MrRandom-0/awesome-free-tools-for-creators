# Contributing

Thank you for helping keep this list honest. The rules below are strict on
purpose: the value of the list is that every entry can be trusted. A smaller
list that is right beats a bigger list that is not.

## The one rule that explains all the others

**Entries live in `tools.json` — and only in `tools.json`.**

`README.md` and the website data file (`docs/tools.json`) are generated from
it by `node scripts/build.mjs`. Pull requests that edit the README directly
will be asked to move the change into `tools.json` instead. CI fails if the
generated files are out of sync.

## Inclusion criteria

A tool may be added only if **all** of these are true:

1. **It has a genuinely free tier.** A person can finish real work with it
   and keep using it for free, indefinitely.
   - ✅ Free plans, free tiers, open-source software, free-with-account tools.
   - ❌ Free *trials* (7 days, 14 days, "enter your card to start").
   - ❌ One-off credit packs that never refill, unless the note says exactly that.
   - ❌ "Free" plans that cannot export, save or publish anything usable.
2. **The free tier's limits are knowable.** You checked the tool's own
   pricing page and can state, in one plain sentence, what free actually
   gives (exports, limits, watermarks, storage, credits).
3. **It serves creators, students or freelancers.** If a normal person
   making videos, posts, music, writing or a small business would not
   plausibly use it weekly, it does not belong here.
4. **The link is clean.** Direct link to the official site. No affiliate
   links, no referral codes or `ref=`/`utm_` parameters added for credit,
   no URL shorteners, no links to review articles instead of the tool.
5. **It is alive.** The site loads, the product is maintained, and the free
   tier still exists on the day you submit.

Maintainers may decline tools that technically qualify but duplicate five
stronger entries in the same niche. Curation is the product.

## How to add a tool

1. Fork the repo and add **one** entry to `tools.json`. One tool per pull
   request — no exceptions; it keeps reviews quick and history clean.
2. Use exactly this shape (field order matters for readable diffs):

   ```json
   {
     "name": "Tool Name",
     "url": "https://example.com",
     "description": "One plain sentence about what it does.",
     "category": "video",
     "freeNote": "Free plan: what you actually get, including the limits",
     "tags": ["short", "lowercase", "slugs"]
   }
   ```

   - `category` must be one of: `video`, `audio`, `design`, `writing`,
     `seo-marketing`, `social`, `productivity`, `ai`, `learning`
     (see `scripts/categories.mjs`).
   - `description`: one line, plain words, no hype, no exclamation marks,
     no superlatives you cannot prove ("best", "#1", "leading").
   - `freeNote`: what the free tier gives, written the way you would tell a
     friend — including the catch, if there is one. Start with "Free plan:",
     "Free tier:" or "Free and open source" where it fits.
   - `tags`: 1–4 short lowercase slugs.
3. Run the checks locally:

   ```bash
   node scripts/validate.mjs   # structure, duplicates, categories, style
   node scripts/build.mjs      # regenerates README.md + docs/tools.json
   node scripts/check-links.mjs --only "Tool Name"   # your link, live
   ```

4. Commit `tools.json`, `README.md` and `docs/tools.json` together and open
   the pull request. Fill in the PR template checklist honestly.

## How to fix or remove a tool

Free tiers shrink all the time. If a note is out of date, the link is dead,
or a free plan has been discontinued:

- **Fix:** one PR updating the entry in `tools.json` (same checks as above).
- **Report:** open an issue — "this tool's free plan changed" is a complete
  and useful report. Maintainers verify and batch removals monthly
  (see [MAINTENANCE.md](MAINTENANCE.md)).

## Style rules for entries

- Sentence case for descriptions. British or American spelling are both
  fine; be consistent inside one entry.
- Say what the tool *does*, not how great it is. "Records your screen" beats
  "the ultimate screen recording experience".
- Numbers beat adjectives: "exports up to 1080p" beats "high quality".

## Code of conduct

Participation is covered by the [Code of Conduct](CODE_OF_CONDUCT.md).
Be kind; assume the person on the other side also wants the list to be good.
