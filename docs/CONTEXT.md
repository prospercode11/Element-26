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
