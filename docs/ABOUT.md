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

Pricing is lifetime-first ($79.99 lifetime + $29.99/yr), positioned between
Hevy and Liftosaur.

See the main [README.md](../README.md) for run instructions, the progression
engine rules, and repo structure.

## Maintenance rule

**This file must be kept up to date.** Every time a task changes what the app
is, what it does, or its product scope, update this file (and
`docs/CONTEXT.md`) in the same change. Do not let these docs drift from the
actual codebase.
