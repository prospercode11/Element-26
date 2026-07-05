# About Element 26

Element 26 is a science-based lifting app with a no-code program builder. The
name is iron's atomic number (26) — the branding leans on iron / periodic-table
motifs.

This repo is a working interactive prototype (React + TypeScript + Vite). It
runs in the browser inside a phone frame and implements five product pillars:

1. **Core tracking engine** (`Today` tab) — logging sets/reps/weight/RPE,
   live-computed working weights, auto-progression on session finish.
2. **No-code program builder** (`Build` tab) — AI Import parser for named
   programs (5/3/1, nSuns, GZCLP, generic %-tables), visual builder, training
   maxes.
3. **Science coaching layer** (`Science` tab) — volume landmarks, fatigue-driven
   deload readiness, evidence-tagged coaching tips, exercise library.
4. **News & research** (`Research` → Feed) — plain-language study cards.
5. **Study search / database** (`Research` → Study Search) — filterable index,
   for/against breakdowns on contested topics.

There's also a **Progress** tab (`ProgressScreen.tsx`) — training-max history,
estimated-1RM trend (Epley formula, `src/data/progression.ts`), and cycle-week
tracking — plus a lifetime **paywall** screen (`PaywallScreen.tsx`).

Pricing is lifetime-first ($79.99 lifetime + $29.99/yr), positioned between
Hevy and Liftosaur.

## How the code is organized

- `src/App.tsx` — the phone-frame shell: tab bar (Today/Build/Science/
  Research/Progress), dark/light theme toggle (persisted to
  `localStorage`), and the first-launch flow (tour → quiz, each
  skippable/replayable, gated on `localStorage` flags `e26-tour-done` /
  `e26-quiz-done`).
- `src/data/store.tsx` — a single React reducer holding all app state
  (in-memory only, no backend/persistence beyond the theme/tour flags
  above), seeded from `src/data/mock.ts` with a 5/3/1 BBB program.
- `src/data/types.ts` — shared domain types (programs, exercises, sets,
  training maxes, cycles).
- `src/data/progression.ts` — the five progression rules (`linear-add`,
  `tm-cycle-bump`, `amrap-autoreg`, `gzclp-stage`, `none`), plate rounding,
  Epley 1RM estimation, and RPE-to-%1RM mapping.
- `src/data/importParser.ts` — deterministic recognizers that turn pasted
  program text (5/3/1, nSuns, GZCLP, generic %-tables) into a structured,
  auto-progressing draft for the AI Import flow.
- `src/screens/*.tsx` — one file per tab (`TodayScreen`, `BuildScreen`,
  `ScienceScreen`, `ResearchScreen`, `ProgressScreen`) plus `PaywallScreen`.
- `src/components/ui.tsx` — shared primitives (cards, badges, the app logo).
- `src/components/Tour.tsx` — first-launch slide walkthrough explaining
  percentage-based programming in plain language.
- `src/components/Quiz.tsx` — a short onboarding quiz shown after the tour.
- `src/components/Gloss.tsx` — tap-to-explain jargon: terms like TM, AMRAP,
  RPE render with a dotted underline and open a plain-language definition
  sheet on tap, so the UI stays clean for experienced lifters but is still
  learnable for beginners.
- `src/components/ExerciseFigure.tsx` / `ExercisePreview.tsx` — minimal
  animated line-art pictograms per exercise (body in current text color,
  bar/load in the ember accent) used in the exercise library and previews.

See the main [README.md](../README.md) for run instructions, the progression
engine rules, and repo structure.

## Maintenance rule

**This file must be kept up to date.** Every time a task changes what the app
is, what it does, or its product scope, update this file (and
`docs/CONTEXT.md`) in the same change. Do not let these docs drift from the
actual codebase.
