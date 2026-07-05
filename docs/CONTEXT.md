# Context Log

This file is a running log of work done on this repo — a history of what was
asked and what changed, so future sessions (human or Claude) have context
without re-deriving it from git log alone.

## Maintenance rule

**This file must always be kept up to date.** Every time a task is completed
in this repo (feature, fix, refactor, config change, etc.), append an entry
below describing what was requested and what changed. Do this in the same
commit/PR as the work itself. Also update `docs/ABOUT.md` if the change
affects what the app does or its scope.

Entry format:

```
## YYYY-MM-DD — short title
Requested: <what was asked>
Changed: <what was actually done, key files touched>
```

---

## 2026-07-05 — Set up docs/ with CONTEXT.md and ABOUT.md
Requested: Create a `docs` folder with a context file and an about file;
update them on every future task, and document that requirement in the files
themselves.
Changed: Added `docs/ABOUT.md` (product/repo overview) and `docs/CONTEXT.md`
(this running log), each stating that they must be kept current going
forward.

## 2026-07-05 — Enriched ABOUT.md from actual code inspection
Requested: Look at the code and describe what it's about in ABOUT.md /
CONTEXT.md (not just the README's product framing).
Changed: Read through `src/` (App.tsx, data/store.tsx, data/types.ts,
data/progression.ts, data/importParser.ts, screens/*, components/*) and added
a "How the code is organized" section to `docs/ABOUT.md` covering: the
reducer-based in-memory store seeded from mock.ts, the 5 progression rules,
the import parser, the phone-frame shell with theme persistence, the
first-launch tour → quiz onboarding flow (gated on localStorage flags), the
Gloss tap-to-explain jargon component, and the ExerciseFigure/ExercisePreview
animated pictograms. Also noted the previously-undocumented `Progress` tab
(training-max history, estimated-1RM trend) and `PaywallScreen`.

## 2026-07-05 — Added GitHub Pages deployment (re-added after revert)
Requested: Deploy the app to GitHub Pages so it can be opened in a browser
without running it locally.
Changed: Set `base: '/Element-26/'` in `vite.config.ts` and added
`.github/workflows/deploy-pages.yml`, a GitHub Actions workflow that runs
`npm run build` and deploys `dist/` to GitHub Pages on every push to `main`
(or manual dispatch). Verified locally that `npm run build` succeeds and
`dist/index.html` references assets under `/Element-26/...` as expected.
Once this PR is merged to `main` and Pages is enabled (Settings → Pages →
Source: "GitHub Actions", one-time, repo admin), the app will be live at
`https://prospercode11.github.io/Element-26/`.
