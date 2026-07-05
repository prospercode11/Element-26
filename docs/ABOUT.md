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
   maxes. The visual builder defaults to a **Simple mode** (plain-language
   presets: Light/Moderate/Heavy intensity, "5×5 — Strength" style rep
   schemes) with an **Advanced** toggle that reveals raw percent/RPE/weight
   and set/rep number inputs for experienced lifters. Every screen leads with
   plain-language "how this works" copy, and jargon (training max, scheme,
   progression rule, AMRAP, RPE) is tap-to-explain via `Gloss.tsx`.
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

## Accounts & persistence

The app has real **sign-up / sign-in / sign-out** plus a **guest** mode,
implemented locally (no backend) in `src/data/auth.tsx`:

- Accounts and the active session live in `localStorage`. Passwords are
  salted + SHA-256 hashed (via the Web Crypto API), never stored in
  plaintext. This is demo-grade, on-device security — **not** a substitute
  for a real server-side auth provider.
- Each account's full app state (programs, training maxes, logged sessions,
  bookmarks, body weight, units, Pro status) is persisted per-user under an
  `e26-state-<userId>` key and reloaded on sign-in, so data survives page
  reloads. Guests are intentionally ephemeral — nothing is saved.
- `auth.tsx` is written against a small `Auth` interface so this local
  implementation can be swapped for a Supabase/Firebase backend later (for
  real cross-device sync) without touching any screen or the store. The same
  code also runs unchanged inside a future Capacitor/WebView iOS wrapper
  (the eventual App Store / IPA target).

## How the code is organized

- `src/App.tsx` — an auth gate plus the phone-frame shell. When signed out it
  renders `AuthScreen`; when signed in it mounts the store for that account
  and renders the tab bar (Today/Build/Science/Research/Progress), the
  dark/light theme toggle (persisted to `localStorage`), an account button
  (opens `ProfileSheet` for units + sign-out), and the first-launch flow
  (tour → quiz, each skippable/replayable, gated on `localStorage` flags
  `e26-tour-done` / `e26-quiz-done`).
- `src/data/auth.tsx` — `AuthProvider` / `useAuth`: local account store,
  password hashing, session restore, sign-up/in/out and guest mode.
- `src/data/store.tsx` — a single React reducer holding all app state, keyed
  to the signed-in account: seeded fresh from `src/data/mock.ts` with a 5/3/1
  BBB program for new users, loaded from `localStorage` for returning ones,
  and persisted on every change (except for guests).
- `src/components/DeviceChrome.tsx` — the shared phone frame (notch + status
  bar) wrapping both the auth screen and the signed-in app.
- `src/components/ProfileSheet.tsx` — account bottom-sheet: shows who's signed
  in, toggles units, and signs out.
- `src/screens/AuthScreen.tsx` — sign-in / sign-up form with a guest option.
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
  RPE, set scheme, and progression rule render with a dotted underline and
  open a plain-language definition sheet on tap, so the UI stays clean for
  experienced lifters but is still learnable for beginners.
- `src/components/ExerciseFigure.tsx` / `ExercisePreview.tsx` — minimal
  animated line-art pictograms per exercise (body in current text color,
  bar/load in the ember accent) used in the exercise library and previews.

## Deployment

The app is deployed to GitHub Pages: `.github/workflows/deploy-pages.yml`
builds the app with `npm run build` and deploys `dist/` on every push to
`main` (or manual dispatch). `vite.config.ts` sets `base: '/Element-26/'` so
built asset paths resolve under the `https://<owner>.github.io/Element-26/`
subpath. Requires Pages enabled once in repo Settings → Pages → Source:
"GitHub Actions".

See the main [README.md](../README.md) for run instructions, the progression
engine rules, and repo structure.

## Maintenance rule

**This file must be kept up to date.** Every time a task changes what the app
is, what it does, or its product scope, update this file (and
`docs/CONTEXT.md`) in the same change. Do not let these docs drift from the
actual codebase.
