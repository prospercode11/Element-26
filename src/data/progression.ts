// ---------------------------------------------------------------------------
// The progression engine. This is the part competitors either lack (Strong/Hevy)
// or hide behind a scripting language (Liftosaur). Here it is plain functions.
// ---------------------------------------------------------------------------

import type {
  ProgressionRuleId,
  SetLog,
  SetScheme,
  Units,
} from './types'

// Smallest weight jump we can actually load on a bar.
export function increment(units: Units): number {
  return units === 'kg' ? 2.5 : 5
}

export function roundToPlate(weight: number, units: Units): number {
  const step = increment(units)
  return Math.round(weight / step) * step
}

// Compute the actual working weight for a set from the training max.
export function computeWeight(
  scheme: SetScheme,
  trainingMax: number,
  units: Units,
): number | null {
  if (scheme.type === 'weight') return scheme.value
  if (scheme.type === 'percent') {
    return roundToPlate((trainingMax * scheme.value) / 100, units)
  }
  // RPE-based: we can't know the absolute weight from TM alone, so the logger
  // shows a target RPE and lets the user enter/confirm the load. We seed an
  // estimate from the TM assuming TM ≈ a heavy single.
  return rpeEstimate(trainingMax, scheme.reps, scheme.value, units)
}

// Epley estimated 1RM from a completed set.
export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

// Rough load for a target RPE at a rep count, derived from an assumed 1RM.
// Uses an RPE→%1RM table (Helms/RTS style) interpolated by reps-in-reserve.
function rpeEstimate(
  oneRepMax: number,
  reps: number,
  targetRpe: number,
  units: Units,
): number {
  const rir = Math.max(0, 10 - targetRpe)
  const totalReps = reps + rir
  const pct = pctFromRepsToFailure(totalReps)
  return roundToPlate(oneRepMax * pct, units)
}

// %1RM you can do for N total reps to failure (Brzycki-ish inverse).
function pctFromRepsToFailure(reps: number): number {
  const table: Record<number, number> = {
    1: 1.0, 2: 0.955, 3: 0.92, 4: 0.892, 5: 0.863, 6: 0.837,
    7: 0.811, 8: 0.786, 9: 0.762, 10: 0.739, 11: 0.717, 12: 0.696,
  }
  const clamped = Math.min(12, Math.max(1, Math.round(reps)))
  return table[clamped]
}

export interface ProgressionResult {
  trainingMaxDelta: number // change to apply to the TM
  message: string // what to show the user
  applied: boolean
}

// Given the logged sets for a main lift in a session, decide how to progress.
export function applyProgression(
  rule: ProgressionRuleId,
  schemes: SetScheme[],
  logs: SetLog[],
  category: string,
  units: Units,
): ProgressionResult {
  const step = increment(units)
  // Upper-body lifts progress in smaller jumps than lower-body.
  const isLower = category === 'squat' || category === 'deadlift' || category === 'legs'
  const cycleBump = isLower ? step * 2 : step

  const allHit = logs.every(
    (l) => l.completed && l.reps !== null && l.reps >= l.targetReps,
  )
  const amrapLog = logs.find((_, i) => schemes[i]?.amrap)
  const amrapScheme = schemes.find((s) => s.amrap)

  switch (rule) {
    case 'linear-add':
      return allHit
        ? {
            trainingMaxDelta: cycleBump,
            applied: true,
            message: `All reps hit — training max +${cycleBump}${units} next session.`,
          }
        : {
            trainingMaxDelta: 0,
            applied: false,
            message: `Missed reps — training max held. Repeat this weight next session.`,
          }

    case 'tm-cycle-bump':
      return {
        trainingMaxDelta: cycleBump,
        applied: true,
        message: `Cycle complete — training max +${cycleBump}${units} (5/3/1 progression).`,
      }

    case 'amrap-autoreg': {
      if (!amrapLog || !amrapScheme || amrapLog.reps === null) {
        return { trainingMaxDelta: 0, applied: false, message: 'No AMRAP set logged — TM held.' }
      }
      const over = amrapLog.reps - amrapScheme.reps
      if (over >= 5)
        return { trainingMaxDelta: cycleBump * 2, applied: true, message: `AMRAP crushed (+${over} reps) — TM +${cycleBump * 2}${units}.` }
      if (over >= 1)
        return { trainingMaxDelta: cycleBump, applied: true, message: `AMRAP beat target by ${over} — TM +${cycleBump}${units}.` }
      if (over === 0)
        return { trainingMaxDelta: 0, applied: true, message: `AMRAP met target exactly — TM held.` }
      return { trainingMaxDelta: -cycleBump, applied: true, message: `AMRAP below target (${amrapLog.reps}/${amrapScheme.reps}) — TM −${cycleBump}${units}, consider a deload.` }
    }

    case 'gzclp-stage':
      return allHit
        ? { trainingMaxDelta: cycleBump, applied: true, message: `Stage cleared — +${cycleBump}${units} next session.` }
        : { trainingMaxDelta: 0, applied: false, message: `Failed reps — drop to next rep stage (e.g. 5×3 → 6×2) before deloading.` }

    case 'none':
    default:
      return { trainingMaxDelta: 0, applied: false, message: 'No auto-progression on this lift.' }
  }
}

export const PROGRESSION_RULES: { id: ProgressionRuleId; label: string; blurb: string }[] = [
  { id: 'linear-add', label: '+weight if all reps hit', blurb: 'Add one increment to the TM next session when every prescribed rep is completed.' },
  { id: 'tm-cycle-bump', label: 'Raise TM each cycle', blurb: 'Classic 5/3/1: bump TM +5 (upper) / +10 (lower) at the end of each cycle.' },
  { id: 'amrap-autoreg', label: 'AMRAP → auto-adjust', blurb: 'Read reps on the last AMRAP set and raise, hold, or drop the TM accordingly.' },
  { id: 'gzclp-stage', label: 'Stage progression (GZCLP)', blurb: 'Advance load on success; step down the rep stage on failure before deloading.' },
  { id: 'none', label: 'No auto-progression', blurb: 'Weights stay fixed; you manage load manually.' },
]
