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

## 2026-07-05 — Simplified the Program Builder for beginners
Requested: Make the program builder way simpler for beginners and explain
everything about it in the app.
Changed: `src/components/Gloss.tsx` — added `scheme` and `progression`
tap-to-explain glossary terms (matching the existing `tm`/`amrap`/`rpe`
pattern). `src/screens/BuildScreen.tsx`:
- Added a persistent plain-language banner at the top of the Build screen
  explaining what each of the 3 sub-tabs (Import / Visual builder / Training
  maxes) does.
- Import tab: added a numbered "how this works" explainer (paste → draft →
  review/save) above the paste box.
- Training maxes tab: wrapped "training max" in the `tm` Gloss term and added
  a plain-language starting-point suggestion for lifters who don't know their
  max.
- Visual builder (`SlotEditor`): rebuilt as a step-by-step flow (Step 1
  lift → Step 2 intensity → Step 3 sets/reps → Step 4 progression) with a
  **Simple** mode (default) using plain-language presets — Light/Moderate/
  Heavy intensity chips and "5×5 — Strength" / "3×8 — Size" / "3×10 — Size"
  rep-scheme chips, each with a one-line explanation of what it's for — plus
  an AMRAP checkbox. An **Advanced** toggle reveals the original raw percent/
  RPE/weight and numeric set/rep inputs for experienced users. Progression
  rule and scheme labels are now Gloss-wrapped.
Verified `npx tsc -b` type-checks clean and a full `npm run build` succeeds
(built in a scratch copy since this sandbox's checked-in `node_modules` has a
platform-mismatched native rollup binary unrelated to this change).

## 2026-07-05 — Added accounts (sign in/out) + per-user persistence
Requested: Make it a fully functional app with all buttons working and
sign-in / sign-out. Context: this will eventually be turned into an IPA for
the Apple App Store.
Changed: Audited every screen — almost all buttons were already wired to the
reducer; the real gaps were no auth (user was hardcoded) and no persistence
(memory-only state). Added a local, backend-free auth + persistence layer:
- NEW `src/data/auth.tsx` — `AuthProvider`/`useAuth`. Accounts + session in
  `localStorage`; passwords salted + SHA-256 hashed via Web Crypto (demo-grade
  on-device security, not a real server auth). Exposes sign-up / sign-in /
  sign-out / continue-as-guest, restores the session on load. Written against
  a small `Auth` interface so it can later be swapped for Supabase/Firebase
  (and it runs unchanged inside a future Capacitor/WebView iOS wrapper — the
  IPA target).
- `src/data/store.tsx` — `StoreProvider` is now keyed to the signed-in
  account: seeds a fresh 5/3/1 state for new users, loads persisted state for
  returning ones, and writes to `e26-state-<userId>` on every change (guests
  stay ephemeral). IDs are now collision-safe (random suffix) so fresh-session
  IDs never clash with persisted ones.
- `src/data/types.ts` — added optional `name` to `User`.
- NEW `src/screens/AuthScreen.tsx` — sign-in / sign-up form + guest option.
- NEW `src/components/DeviceChrome.tsx` — shared phone frame (notch + status
  bar) used by both the auth screen and the app, extracted from `App.tsx`.
- NEW `src/components/ProfileSheet.tsx` — account sheet (identity, units
  toggle, sign out) opened from a new appbar account button.
- `src/App.tsx` — split into an auth gate + `AppShell`; mounts the store only
  once signed in.
- `src/main.tsx` — wraps the tree in `AuthProvider` (store moved inside the
  signed-in branch).
- `src/styles.css` — styled `email`/`password` inputs; added `.auth-screen`,
  `.auth-divider`, `.profile-id`, `.profile-avatar`.
Verified end-to-end in a headless browser (Playwright + preview build):
sign-up → app, password stored hashed (not plaintext), account/session/state
written to localStorage, units change survives a reload, sign-out → auth
screen, wrong password → error, sign-in → app, guest → app and correctly
NOT persisted. `npx tsc -b` clean; full `npm run build` succeeds.

## 2026-07-06 — New accounts start empty (no preset exercises) + onboarding
Requested: The app must start with no preset exercises, so a new user begins
with the tour and the workout planner/builder quiz.
Changed:
- `src/data/store.tsx` — replaced the seeded 5/3/1 starting state with
  `emptyState()`: new accounts start with no programs, slots, training maxes,
  sessions, bookmarks, or body-weight history (neutral cycle placeholder,
  empty `activeProgramId`). Removed the now-unused seed helpers. `advanceCycle`
  is defensive when there's no active program.
- Onboarding is now **per-account**: `src/App.tsx` gates the tour/quiz on
  `e26-tour-done-<userId>` / `e26-quiz-done-<userId>` (was global), so every
  new sign-up gets the tour → quiz. The quiz's "build one for me" path creates
  the first program from empty via `draftImport` + `commitDraft`.
- Empty-state handling so nothing crashes with no program: new shared
  `EmptyState` in `src/components/ui.tsx`; `TodayScreen` and `ProgressScreen`
  show it with a "Build" CTA (new `openBuild` prop wired from `AppShell`);
  `ScienceScreen` and `BuildScreen`'s visual builder guard their previously
  non-null `programs.find(...)!` lookups.
- `src/styles.css` — `.empty-state` / `.empty-ico` / `.empty-title` /
  `.empty-body`.
Verified in a headless browser: new sign-up starts empty (0 programs/slots/
TMs/sessions); tour auto-shows then the quiz; the quiz "build for me" path
creates a real program (1 program, 4 slots); Today/Progress empty states and
their Build CTAs work; Science renders without crashing. `npx tsc -b` clean;
full `npm run build` succeeds.

## 2026-07-06 — Integrated the Claude API (AI program generation via a proxy)
Requested: Put the Claude API into the app to generate training plans and other
AI features. Chosen: Vercel backend; first feature = quiz → custom program.
Changed: Added a server-side proxy so the API key never ships in the static
frontend (hard security requirement — the SDK refuses to run in a browser).
- NEW `api/generate-program.ts` — Vercel serverless function. Holds
  `ANTHROPIC_API_KEY`, calls `claude-opus-4-8` with adaptive thinking + effort
  "medium" and structured outputs (a JSON schema mirroring `ImportDraft`, with
  the `exerciseId` enum built from the catalog the client posts). Returns a
  draft. CORS-enabled (configurable `ALLOWED_ORIGIN`); handles the `refusal`
  stop reason.
- NEW `src/data/ai.ts` — frontend client that `fetch`es the proxy (never the
  Claude API). Endpoint = `VITE_AI_ENDPOINT` or same-origin
  `/api/generate-program`. Sends quiz answers, units, the exercise catalog, and
  current training maxes; returns an `ImportDraft`.
- `src/data/store.tsx` — added a `setDraft` action so an AI-generated draft can
  be set as `pendingDraft` and committed like a parsed import.
- `src/components/Quiz.tsx` — the "build one for me" result path now calls
  `generateProgram()` ("Generate my plan with AI" button + spinner) and commits
  the AI draft; on any proxy error it silently falls back to the template path.
- `package.json` — added `@anthropic-ai/sdk` (^0.110.0, server-only; the
  frontend uses `fetch`). `@types/node` devDep for the function.
- NEW `src/vite-env.d.ts` (types `import.meta.env.VITE_AI_ENDPOINT`),
  `vercel.json` (60s function max duration), `.env.example` (documents
  `ANTHROPIC_API_KEY`/`ALLOWED_ORIGIN`/`VITE_AI_ENDPOINT`).
- `node_modules/` was intentionally NOT committed for this change — the deploy
  workflow runs `npm ci`, and the local install pulled platform-specific
  binaries that would pollute the committed tree; `package-lock.json` records
  the exact versions.
Verified in a headless browser with a mocked proxy: success path commits the
AI-generated program; a 500 from the proxy falls back to a template; and the
built frontend bundle contains no "anthropic" reference (key/SDK stay
server-side). `npx tsc -b` clean; full `npm run build` succeeds.

## 2026-07-06 — Recorded standing directions: science-based + iOS target
Requested: Note that the app will be turned into an iOS app and that everything
needs to be science-based.
Changed: Added a load-bearing "Product principles" section to `docs/ABOUT.md`
capturing both as durable constraints for all future work. Acted on the
science-based directive concretely by strengthening the AI program-generation
system prompt (`api/generate-program.ts`) with an explicit evidence-based core
principle (volume landmarks MEV/MAV/MRV, load–goal matching, ~2x/week
frequency, progressive overload + autoregulation, no fads/pseudo-science) and
a requirement to state the evidence-based rationale in the program's notes.
