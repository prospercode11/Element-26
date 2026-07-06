# Element 26

A science-based lifting app with a no-code program builder. The name is iron's
atomic number (26) — the branding leans on iron / periodic-table motifs.

This repo is a **working interactive prototype** (React + TypeScript + Vite). It
runs in the browser inside a phone frame and implements all five product pillars
with real logic where it matters — a genuine progression engine, an AI-import
parser for named programs, live-computed working weights, evidence-tagged science
tips, a research feed/search, and the lifetime-first paywall.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## What's implemented

**Part 1 — Core tracking engine** (`Today` tab)
- Log sets/reps/weight/RPE with one-tap set completion and a rest timer
- Working weights computed live from the current training max (`src/data/progression.ts`)
- Auto-progression applied on session finish (see progression rules below)

**Part 2 — No-code program builder** (`Build` tab)
- **AI Import** (the magic moment): paste a Lift Vault–style program (5/3/1, nSuns,
  GZCLP, or a generic %-table) and get a structured, auto-progressing draft to
  review before saving. Parser: `src/data/importParser.ts`.
- **Visual builder**: pick a lift, define a per-set scheme (% of TM / RPE / straight
  weight), choose a progression rule from a dropdown — no scripting.
- **Training maxes**: everything downstream is computed from these.

**Part 3 — Science coaching layer** (`Science` tab)
- Weekly volume per muscle vs. MEV/MAV/MRV landmarks, computed from the active program
- Fatigue-driven deload readiness (from RPE trends / missed reps / cycle depth), not a calendar
- Coaching tips filtered to the running program, each with an **Evidence Score** tag + citation
- Exercise library with biomechanical notes (moment arms, stretch-mediated hypertrophy, stability)

**Part 4 — News & research** (`Research` → Feed)
- Plain-language study cards: what was tested, subjects, findings, caveats; topic tags + evidence badges

**Part 5 — Study search / database** (`Research` → Study Search, For/Against)
- Filterable index (topic / design / sample), search, saved bookmarks (a Pro feature)
- "For / against" breakdowns on contested topics (training to failure, fasted training, stretching)

**Pricing** (`Upgrade`)
- Lifetime-first: **$79.99 lifetime** headline + $29.99/yr, positioned between Hevy and Liftosaur
- Free tier = full logging + one program; Pro = AI import, research DB, auto-regulation

## Progression engine (`src/data/progression.ts`)

| Rule | Behavior |
|------|----------|
| `linear-add` | +1 increment to TM next session if all reps hit |
| `tm-cycle-bump` | 5/3/1: +5 (upper) / +10 (lower) each cycle |
| `amrap-autoreg` | Read the AMRAP set vs. target → raise / hold / drop TM |
| `gzclp-stage` | Advance on success; step down rep stage on failure before deloading |
| `none` | Fixed load |

Weights round to loadable plates; estimated 1RM uses Epley; RPE targets map through
a reps-to-failure %1RM table.

## Structure

```
src/
  data/        types.ts · progression.ts · importParser.ts · mock.ts · store.tsx
  components/  ui.tsx (badges, cards, logo)
  screens/     TodayScreen · BuildScreen · ScienceScreen · ResearchScreen · ProgressScreen · PaywallScreen
  App.tsx      phone frame + tab navigation
```

## Prototype scope notes

- Accounts (sign-up/in/out + guest) and per-user state are persisted locally in `localStorage`
  with no backend — passwords are salted + SHA-256 hashed (demo-grade, on-device only). The auth
  layer (`src/data/auth.tsx`) is written to be swappable for a Supabase/Firebase backend later.
- New accounts start empty (no preset program/exercises); the first-run tour and builder quiz
  create the first program. State is a React reducer, reloaded from `localStorage` for returning
  accounts.
- AI Import uses deterministic recognizers so the demo is reproducible; production would run
  OCR + an LLM structuring pass server-side, then hand back the same review-before-save draft.
- Study search queries a local index; production plan is PubMed API integration behind the same filters.
- Intentionally out of scope for v1 (per spec): social feed, from-scratch AI coach, Watch app,
  form-check video library, nutrition tracking, streaks/gamification, a general scripting escape hatch.
# Element-26
# Element-26
# Element-26
