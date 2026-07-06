// ---------------------------------------------------------------------------
// Vercel serverless function: generate a personalized training program with
// Claude. This runs on the SERVER — it holds ANTHROPIC_API_KEY and is the only
// place that talks to the Anthropic API. The browser calls this endpoint; it
// never sees the key.
//
// Deploy: set ANTHROPIC_API_KEY in the Vercel project's Environment Variables.
// The same endpoint works unchanged when the app is wrapped with Capacitor for
// iOS — the WebView just calls this URL.
// ---------------------------------------------------------------------------

import Anthropic from '@anthropic-ai/sdk'

// Minimal request/response typing so we don't need the @vercel/node types.
interface Req {
  method?: string
  body?: unknown
}
interface Res {
  status: (code: number) => Res
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
  end: (body?: string) => void
}

const MODEL = 'claude-opus-4-8'

// Shapes posted by the frontend (src/data/ai.ts).
interface ExerciseInfo {
  id: string
  name: string
  isMainLift: boolean
}
interface TrainingMaxInfo {
  exerciseId: string
  value: number
}
interface GenerateRequest {
  answers: Record<string, string>
  exercises: ExerciseInfo[]
  trainingMaxes?: TrainingMaxInfo[]
  units?: 'lb' | 'kg'
}

const PROGRESSION_RULES = ['none', 'linear-add', 'tm-cycle-bump', 'amrap-autoreg', 'gzclp-stage']

// JSON Schema for structured outputs — mirrors src/data/importParser.ts's
// ImportDraft (minus the fields the app fills in). exerciseId's enum is built
// per-request from the catalog the client sends, so the model can only pick
// real exercises.
function buildSchema(exerciseIds: string[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['detected', 'confidence', 'lengthInWeeks', 'daysPerWeek', 'slots', 'notes'],
    properties: {
      detected: { type: 'string', description: 'Human-facing name for the generated program.' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      lengthInWeeks: { type: 'integer' },
      daysPerWeek: { type: 'integer' },
      slots: {
        type: 'array',
        description: 'One entry per exercise, per training day, per week.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['week', 'day', 'exerciseId', 'sets', 'progressionRule', 'label'],
          properties: {
            week: { type: 'integer' },
            day: { type: 'integer' },
            exerciseId: { type: 'string', enum: exerciseIds },
            sets: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['type', 'value', 'reps', 'amrap'],
                properties: {
                  type: { type: 'string', enum: ['percent', 'rpe', 'weight'] },
                  value: {
                    type: 'number',
                    description: 'percent → % of training max; rpe → target RPE 1-10; weight → absolute load',
                  },
                  reps: { type: 'integer' },
                  amrap: { type: 'boolean', description: 'true = as-many-reps-as-possible top set' },
                },
              },
            },
            progressionRule: { type: 'string', enum: PROGRESSION_RULES },
            label: { type: 'string' },
          },
        },
      },
      notes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Assumptions made and guidance for the user, e.g. to set training maxes.',
      },
    },
  }
}

const SYSTEM = `You are the programming engine for Element 26, a science-based lifting app.
Generate a complete, personalized weightlifting program from the user's quiz answers.

How loading works in this app:
- Each set has a "type": "percent" (a percentage of the lifter's Training Max), "rpe" (a target RPE 1-10), or "weight" (an absolute load). For main barbell lifts, ALWAYS use "percent" so weights track the training max.
- Mark the top working set of a main lift as an AMRAP set (amrap: true) when the progression rule reads it.
- "progressionRule" per exercise decides how the training max changes:
  - "linear-add": add weight next session if all reps hit (great for beginners).
  - "tm-cycle-bump": raise the training max at the end of each multi-week cycle (5/3/1 style).
  - "amrap-autoreg": read the AMRAP top set and raise/hold/drop the training max.
  - "gzclp-stage": advance load on success; step down the rep stage on failure.
  - "none": fixed load (typical for accessories).

Rules:
- Only use exerciseId values from the provided catalog. Prefer the main lifts for primary work and accessories for supplemental volume.
- Match daysPerWeek to how many days the user can train. Number days 1..daysPerWeek and weeks 1..lengthInWeeks.
- Choose a sensible cycle length (e.g. 1 week for weekly-autoregulated, 3 weeks for 5/3/1 waves).
- Beginners → linear progression and simpler set/rep schemes. More advanced or strength-focused → percentage waves with AMRAP autoregulation.
- Put helpful assumptions in "notes" (always include a reminder to set Training Maxes to ~90% of a true 1RM).
- Keep it realistic and safe. Do not invent exercises.`

export default async function handler(req: Req, res: Res) {
  const allowOrigin = process.env.ALLOWED_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Server is not configured with an ANTHROPIC_API_KEY.' })
    return
  }

  let payload: GenerateRequest
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as GenerateRequest)
  } catch {
    res.status(400).json({ error: 'Invalid JSON body.' })
    return
  }

  const exercises = Array.isArray(payload?.exercises) ? payload.exercises : []
  if (exercises.length === 0) {
    res.status(400).json({ error: 'No exercise catalog provided.' })
    return
  }
  const exerciseIds = exercises.map((e) => e.id)

  const userContext = {
    quizAnswers: payload.answers ?? {},
    units: payload.units ?? 'lb',
    availableExercises: exercises,
    knownTrainingMaxes: payload.trainingMaxes ?? [],
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: buildSchema(exerciseIds) },
      },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content:
            'Generate a program for this lifter. Return only the structured program.\n\n' +
            JSON.stringify(userContext, null, 2),
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming)

    if (response.stop_reason === 'refusal') {
      res.status(422).json({ error: 'The request was declined by the model.' })
      return
    }

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      res.status(502).json({ error: 'No program returned by the model.' })
      return
    }

    const draft = JSON.parse(textBlock.text)
    // Fill in the fields the client's ImportDraft expects but the model doesn't set.
    draft.rawMatched = 'ai-generated'
    res.status(200).json({ draft })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(502).json({ error: `Program generation failed: ${message}` })
  }
}
