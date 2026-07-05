// ---------------------------------------------------------------------------
// AI Import. A user pastes a spreadsheet dump / screenshot text of a named
// program (Lift Vault style) and we draft a structured, auto-progressing cycle
// for review. In production the OCR + LLM structuring runs server-side; here we
// use deterministic recognizers so the prototype's magic moment is reproducible.
//
// Returns a DRAFT the user reviews and edits before it is saved — never a
// silent commit. This is the explicit anti-"scripting language" stance.
// ---------------------------------------------------------------------------

import type { ProgramSlot, ProgressionRuleId, SetScheme } from './types'
import { EXERCISES } from './mock'

export interface ImportDraft {
  detected: string // human-facing name of what we recognized
  confidence: 'high' | 'medium' | 'low'
  lengthInWeeks: number
  daysPerWeek: number
  slots: Omit<ProgramSlot, 'id' | 'programId'>[]
  notes: string[] // things we assumed or couldn't parse, shown to the user
  rawMatched: string // which template matched
}

// Map program lift keywords to library exercise ids. "press" means overhead
// press in these programs, so match it explicitly before substring fallback.
const LIFT_ALIASES: Record<string, string> = {
  press: 'ex-ohp',
  ohp: 'ex-ohp',
  'overhead press': 'ex-ohp',
  bench: 'ex-bench',
  'bench press': 'ex-bench',
  squat: 'ex-squat',
  deadlift: 'ex-deadlift',
}

function exId(nameFragment: string): string {
  const f = nameFragment.toLowerCase().trim()
  if (LIFT_ALIASES[f]) return LIFT_ALIASES[f]
  const hit = EXERCISES.find((e) => e.name.toLowerCase().includes(f))
  return hit ? hit.id : 'ex-unknown'
}

const MAIN_LIFTS = ['press', 'bench', 'squat', 'deadlift'] as const

// ---- Recognizers ------------------------------------------------------------

function detect531(text: string): ImportDraft | null {
  const t = text.toLowerCase()
  const is531 = /5\s*\/\s*3\s*\/\s*1|wendler|5-3-1/.test(t)
  if (!is531) return null
  const bbb = /bbb|boring but big|5x10|5×10/.test(t)

  // The canonical 5/3/1 percentages of Training Max across a 3-week wave.
  const weekPcts: number[][] = [
    [65, 75, 85], // week 1: 5/5/5+
    [70, 80, 90], // week 2: 3/3/3+
    [75, 85, 95], // week 3: 5/3/1+
  ]
  const weekReps: number[][] = [
    [5, 5, 5],
    [3, 3, 3],
    [5, 3, 1],
  ]

  const slots: ImportDraft['slots'] = []
  MAIN_LIFTS.forEach((lift, day) => {
    for (let w = 0; w < 3; w++) {
      const sets: SetScheme[] = weekPcts[w].map((pct, i) => ({
        type: 'percent',
        value: pct,
        reps: weekReps[w][i],
        amrap: i === 2, // last set is the "+" (AMRAP) set
      }))
      slots.push({
        week: w + 1,
        day: day + 1,
        exerciseId: exId(lift),
        sets,
        progressionRule: 'tm-cycle-bump' as ProgressionRuleId,
        label: `5/3/1 Main — ${cap(lift)}`,
      })
      if (bbb) {
        slots.push({
          week: w + 1,
          day: day + 1,
          exerciseId: exId(lift),
          sets: Array.from({ length: 5 }, () => ({ type: 'percent', value: 50, reps: 10 })),
          progressionRule: 'none',
          label: 'BBB — 5×10 @ 50% TM',
        })
      }
    }
  })

  return {
    detected: bbb ? '5/3/1 Boring But Big' : '5/3/1 (Wendler)',
    confidence: 'high',
    lengthInWeeks: 3,
    daysPerWeek: 4,
    slots,
    notes: [
      'Set your Training Max to ~90% of your true 1RM for each lift on the next screen.',
      'Last set of each main lift is an AMRAP ("+") set — reps there drive the trend.',
      bbb ? 'BBB volume set to 5×10 @ 50% TM (bump to 60–70% as you adapt).' : 'No supplemental volume detected — add BBB/FSL if your sheet had it.',
    ],
    rawMatched: '5/3/1',
  }
}

function detectNsuns(text: string): ImportDraft | null {
  const t = text.toLowerCase()
  if (!/nsuns|n-suns|n suns/.test(t)) return null

  // nSuns 5/3/1 main lift wave: 9 sets, last few are AMRAP-ish / back-off.
  const mainPcts = [65, 75, 85, 85, 85, 80, 75, 70, 65]
  const mainReps = [8, 6, 4, 4, 4, 5, 6, 7, 8]
  const amrapIndex = 2 // the 85% x1+ top set

  const slots: ImportDraft['slots'] = []
  const days: [string, number][] = [
    ['bench', 1], ['squat', 2], ['press', 3], ['deadlift', 4],
  ]
  days.forEach(([lift, day]) => {
    const sets: SetScheme[] = mainPcts.map((pct, i) => ({
      type: 'percent',
      value: pct,
      reps: mainReps[i],
      amrap: i === amrapIndex,
    }))
    slots.push({
      week: 1,
      day,
      exerciseId: exId(lift),
      sets,
      progressionRule: 'amrap-autoreg',
      label: `nSuns Main — ${cap(lift)} (9 sets)`,
    })
  })

  return {
    detected: 'nSuns 5/3/1 LP',
    confidence: 'high',
    lengthInWeeks: 1,
    daysPerWeek: 4,
    slots,
    notes: [
      'nSuns auto-regulates weekly off the AMRAP top set — TM adjusts each week, no fixed cycle.',
      'Accessory / secondary lift T2 work not shown here — add per your sheet on the builder screen.',
    ],
    rawMatched: 'nSuns',
  }
}

function detectGzclp(text: string): ImportDraft | null {
  const t = text.toLowerCase()
  if (!/gzclp|gzcl/.test(t)) return null

  const slots: ImportDraft['slots'] = []
  const t1: [string, number][] = [['squat', 1], ['press', 2], ['deadlift', 3], ['bench', 4]]
  t1.forEach(([lift, day]) => {
    // T1: 5×3 with a final AMRAP; stage progression on failure.
    const sets: SetScheme[] = Array.from({ length: 5 }, (_, i) => ({
      type: 'percent', value: 85, reps: 3, amrap: i === 4,
    }))
    slots.push({
      week: 1, day, exerciseId: exId(lift), sets,
      progressionRule: 'gzclp-stage', label: `T1 — ${cap(lift)} 5×3+`,
    })
  })

  return {
    detected: 'GZCLP',
    confidence: 'medium',
    lengthInWeeks: 1,
    daysPerWeek: 4,
    slots,
    notes: [
      'T1 modeled at ~85% TM, 5×3+. On a failed session the engine steps you 5×3 → 6×2 → 10×1 before deloading.',
      'T2 (3×10) and T3 accessory work omitted from the draft — add them in the builder.',
    ],
    rawMatched: 'GZCLP',
  }
}

// Generic percentage table: pull lines like "Squat 5x5 @ 80%" or "80% x5".
function detectGenericPercentTable(text: string): ImportDraft | null {
  const lineRe = /(\d{2,3})\s*%[^0-9]{0,6}(?:x|×|\bfor\b)?\s*(\d{1,2})?\s*(?:reps?|x)?/gi
  const setRe = /(\d{1,2})\s*(?:x|×)\s*(\d{1,2})\s*@?\s*(\d{2,3})\s*%/gi
  const slots: ImportDraft['slots'] = []
  const notes: string[] = []

  // "3x5 @ 80%" style
  let m: RegExpExecArray | null
  let day = 1
  while ((m = setRe.exec(text)) !== null) {
    const [, nSets, reps, pct] = m
    const count = Math.min(10, parseInt(nSets, 10))
    const sets: SetScheme[] = Array.from({ length: count }, () => ({
      type: 'percent', value: parseInt(pct, 10), reps: parseInt(reps, 10),
    }))
    slots.push({
      week: 1, day, exerciseId: 'ex-unknown', sets,
      progressionRule: 'linear-add', label: `Imported set: ${nSets}×${reps} @ ${pct}%`,
    })
    day++
  }

  if (slots.length === 0) {
    // fall back to bare "80% x5"
    while ((m = lineRe.exec(text)) !== null) {
      const pct = parseInt(m[1], 10)
      const reps = m[2] ? parseInt(m[2], 10) : 5
      slots.push({
        week: 1, day, exerciseId: 'ex-unknown',
        sets: [{ type: 'percent', value: pct, reps }],
        progressionRule: 'linear-add', label: `Imported: ${pct}% × ${reps}`,
      })
      day++
    }
  }

  if (slots.length === 0) return null
  notes.push('Couldn’t match a named template — extracted percentage/rep pairs generically.')
  notes.push('Exercises weren’t identified from the text — assign a lift to each block in the builder.')

  return {
    detected: 'Custom percentage program',
    confidence: 'low',
    lengthInWeeks: 1,
    daysPerWeek: Math.min(6, slots.length),
    slots,
    notes,
    rawMatched: 'generic',
  }
}

// ---- Public entry point -----------------------------------------------------

export function parseImport(text: string): ImportDraft | null {
  const trimmed = text.trim()
  if (trimmed.length < 3) return null
  return (
    detect531(trimmed) ||
    detectNsuns(trimmed) ||
    detectGzclp(trimmed) ||
    detectGenericPercentTable(trimmed)
  )
}

// Sample paste-ins the demo offers as one-tap chips.
export const SAMPLE_PASTES: { label: string; text: string }[] = [
  {
    label: '5/3/1 BBB',
    text: `Wendler 5/3/1 Boring But Big
Week 1: 65% x5, 75% x5, 85% x5+
Week 2: 70% x3, 80% x3, 90% x3+
Week 3: 75% x5, 85% x3, 95% x1+
BBB: 5x10 @ 50%
Lifts: OHP, Deadlift, Bench, Squat`,
  },
  {
    label: 'nSuns 5/3/1',
    text: `nSuns 531 LP - Bench day
65%x8, 75%x6, 85%x4, 85%x4, 85%x4, 80%x5, 75%x6, 70%x7, 65%x8+
4 day: Bench / Squat / OHP / Deadlift`,
  },
  {
    label: 'GZCLP',
    text: `GZCLP
T1 Squat 5x3+ @ 85%
T1 OHP, Deadlift, Bench
Stage progression on failure`,
  },
  {
    label: 'Custom sheet',
    text: `My spreadsheet
Day 1: 3x5 @ 80%
Day 2: 5x3 @ 87%
Day 3: 4x6 @ 72%`,
  },
]

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
