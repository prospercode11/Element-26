// ---------------------------------------------------------------------------
// Frontend AI client. This talks to OUR serverless proxy (api/generate-program),
// never to the Anthropic API directly — the API key lives only on the server.
//
// Endpoint resolution:
//   - VITE_AI_ENDPOINT env var if set (use this when the app is hosted apart
//     from the proxy, e.g. app on GitHub Pages + proxy on Vercel).
//   - otherwise "/api/generate-program" (same-origin — when the whole app is
//     deployed to Vercel).
// ---------------------------------------------------------------------------

import type { ImportDraft } from './importParser'
import { EXERCISES } from './mock'
import { latestTM } from './store'
import type { Units } from './types'

const ENDPOINT =
  (import.meta.env.VITE_AI_ENDPOINT as string | undefined) || '/api/generate-program'

// True when an endpoint override is configured. Same-origin `/api/...` may or
// may not exist depending on where the app is deployed, so callers should still
// handle errors — this is only a hint for whether to offer the AI path.
export const aiConfigured = Boolean(import.meta.env.VITE_AI_ENDPOINT)

export interface GenerateProgramInput {
  answers: Record<string, string>
  units: Units
  // Minimal state slice needed to read current training maxes.
  trainingMaxes: { exerciseId: string; value: number }[]
}

// Ask the proxy to generate a personalized program. Returns an ImportDraft the
// caller reviews/commits exactly like a parsed import. Throws on any failure so
// the caller can fall back to a template.
export async function generateProgram(input: GenerateProgramInput): Promise<ImportDraft> {
  const exercises = EXERCISES.map((e) => ({ id: e.id, name: e.name, isMainLift: e.isMainLift }))

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers: input.answers,
      units: input.units,
      exercises,
      trainingMaxes: input.trainingMaxes,
    }),
  })

  if (!res.ok) {
    let detail = `${res.status}`
    try {
      const body = await res.json()
      if (body?.error) detail = body.error
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  const body = await res.json()
  const draft = body?.draft as ImportDraft | undefined
  if (!draft || !Array.isArray(draft.slots) || draft.slots.length === 0) {
    throw new Error('The model returned an empty program.')
  }
  return draft
}

// Convenience: read the current training maxes for the main lifts out of state
// (any object with a `trainingMaxes` array works — typed loosely to avoid a
// circular import with the full State type).
export function mainLiftTMs(state: Parameters<typeof latestTM>[0]): {
  exerciseId: string
  value: number
}[] {
  return EXERCISES.filter((e) => e.isMainLift)
    .map((e) => ({ exerciseId: e.id, value: latestTM(state, e.id) }))
    .filter((tm) => tm.value > 0)
}
