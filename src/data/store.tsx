import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type {
  BodyWeight,
  Bookmark,
  CycleState,
  Program,
  ProgramSlot,
  Session,
  SetLog,
  TrainingMax,
  Units,
  User,
} from './types'
import { applyProgression, computeWeight } from './progression'
import type { ImportDraft } from './importParser'
import { parseImport } from './importParser'

let counter = 1
const uid = (p: string) => `${p}-${counter++}`

const DAY_MS = 86_400_000
const isoDaysAgo = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString().slice(0, 10)

// ---- Seed ------------------------------------------------------------------

function seedSlots(programId: string): ProgramSlot[] {
  const draft = parseImport(
    'Wendler 5/3/1 Boring But Big\nWeek 1 65 75 85+\nWeek 2 70 80 90+\nWeek 3 75 85 95+\nBBB 5x10 @ 50%\nOHP Deadlift Bench Squat',
  )!
  return draft.slots.map((s) => ({ ...s, id: uid('slot'), programId }))
}

function seedTMHistory(userId: string): TrainingMax[] {
  // A few cycles of history per lift to render an estimated-1RM trend.
  const rows: [string, number[]][] = [
    ['ex-squat', [285, 295, 305, 315]],
    ['ex-bench', [200, 205, 210, 215]],
    ['ex-deadlift', [355, 370, 385, 400]],
    ['ex-ohp', [130, 133, 136, 140]],
  ]
  const out: TrainingMax[] = []
  const base = new Date('2026-04-01')
  rows.forEach(([exId, vals]) => {
    vals.forEach((v, i) => {
      const d = new Date(base)
      d.setDate(base.getDate() + i * 21)
      out.push({
        id: uid('tm'),
        userId,
        exerciseId: exId,
        value: v,
        effectiveDate: d.toISOString().slice(0, 10),
      })
    })
  })
  return out
}

// Three weeks of completed sessions (4×/week pattern) so streak and history
// render with real data. Rest-day gaps of up to 3 days keep a streak alive.
function seedSessions(userId: string, programId: string): Session[] {
  const offsets = [2, 3, 5, 6, 9, 10, 12, 13, 16, 17, 19, 20]
  return offsets.map((daysAgo, i) => ({
    id: uid('sess'),
    userId,
    programId,
    week: 0, // historical — before the current cycle
    day: (i % 4) + 1,
    date: isoDaysAgo(daysAgo),
    status: 'complete' as const,
  }))
}

function seedBodyWeights(): BodyWeight[] {
  const vals = [186.8, 186.2, 185.9, 185.1, 184.6, 184.9, 184.1, 183.6]
  return vals.map((v, i) => ({
    id: uid('bw'),
    date: isoDaysAgo((vals.length - 1 - i) * 7),
    value: v,
  }))
}

interface State {
  user: User
  programs: Program[]
  activeProgramId: string
  slots: ProgramSlot[]
  trainingMaxes: TrainingMax[]
  sessions: Session[]
  setLogs: SetLog[]
  cycle: CycleState
  bookmarks: Bookmark[]
  bodyWeights: BodyWeight[]
  pendingDraft: ImportDraft | null
}

function initState(): State {
  const user: User = { id: 'u1', email: 'ruser1819@gmail.com', units: 'lb', isPro: false }
  const program: Program = {
    id: 'p1',
    userId: user.id,
    name: '5/3/1 Boring But Big',
    lengthInWeeks: 3,
    daysPerWeek: 4,
    source: 'imported',
    importNote: 'Imported from a Lift Vault–style spreadsheet paste.',
  }
  const slots = seedSlots(program.id)
  const cycle: CycleState = { id: 'c1', programId: program.id, currentWeek: 1, currentCycle: 2, deloadFlag: false }
  return {
    user,
    programs: [program],
    activeProgramId: program.id,
    slots,
    trainingMaxes: seedTMHistory(user.id),
    sessions: seedSessions(user.id, program.id),
    setLogs: [],
    cycle,
    bookmarks: [{ id: uid('bm'), userId: user.id, studyId: 'st-2' }],
    bodyWeights: seedBodyWeights(),
    pendingDraft: null,
  }
}

// ---- Selectors -------------------------------------------------------------

export function latestTM(state: State, exerciseId: string): number {
  const rows = state.trainingMaxes
    .filter((t) => t.exerciseId === exerciseId)
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
  return rows.length ? rows[rows.length - 1].value : 0
}

export function tmHistory(state: State, exerciseId: string): TrainingMax[] {
  return state.trainingMaxes
    .filter((t) => t.exerciseId === exerciseId)
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
}

// Slots for the currently-selected training day.
export function slotsForDay(state: State, week: number, day: number): ProgramSlot[] {
  return state.slots.filter(
    (s) => s.programId === state.activeProgramId && s.week === week && s.day === day,
  )
}

export function daysInProgram(state: State): number[] {
  const days = new Set(
    state.slots.filter((s) => s.programId === state.activeProgramId).map((s) => s.day),
  )
  return [...days].sort((a, b) => a - b)
}

// Consecutive completed sessions, walking back from today. A gap of more than
// 3 days between sessions (or since the last one) breaks the streak — normal
// rest days don't.
export function computeStreak(sessions: Session[]): number {
  const dates = [...new Set(sessions.filter((s) => s.status === 'complete').map((s) => s.date))]
    .sort()
    .reverse()
  if (dates.length === 0) return 0
  let prev = new Date(new Date().toISOString().slice(0, 10)).getTime()
  let streak = 0
  for (const d of dates) {
    const t = new Date(d).getTime()
    if (prev - t > 3 * DAY_MS) break
    streak++
    prev = t
  }
  return streak
}

export function latestBodyWeight(state: State): BodyWeight | null {
  if (state.bodyWeights.length === 0) return null
  return [...state.bodyWeights].sort((a, b) => a.date.localeCompare(b.date))[
    state.bodyWeights.length - 1
  ]
}

// ---- Actions ---------------------------------------------------------------

type Action =
  | { type: 'setUnits'; units: Units }
  | { type: 'upgradePro' }
  | { type: 'draftImport'; text: string }
  | { type: 'clearDraft' }
  | { type: 'commitDraft'; name: string }
  | { type: 'setTM'; exerciseId: string; value: number }
  | { type: 'logSet'; log: SetLog }
  | { type: 'finishDay'; week: number; day: number }
  | { type: 'advanceCycle' }
  | { type: 'toggleBookmark'; studyId: string }
  | { type: 'logBodyWeight'; value: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setUnits':
      return { ...state, user: { ...state.user, units: action.units } }

    case 'upgradePro':
      return { ...state, user: { ...state.user, isPro: true } }

    case 'draftImport':
      return { ...state, pendingDraft: parseImport(action.text) }

    case 'clearDraft':
      return { ...state, pendingDraft: null }

    case 'commitDraft': {
      const draft = state.pendingDraft
      if (!draft) return state
      const program: Program = {
        id: uid('p'),
        userId: state.user.id,
        name: action.name || draft.detected,
        lengthInWeeks: draft.lengthInWeeks,
        daysPerWeek: draft.daysPerWeek,
        source: 'imported',
        importNote: `AI Import • matched "${draft.detected}" (${draft.confidence} confidence)`,
      }
      const slots: ProgramSlot[] = draft.slots.map((s) => ({
        ...s,
        id: uid('slot'),
        programId: program.id,
      }))
      return {
        ...state,
        programs: [...state.programs, program],
        slots: [...state.slots, ...slots],
        activeProgramId: program.id,
        cycle: { id: uid('c'), programId: program.id, currentWeek: 1, currentCycle: 1, deloadFlag: false },
        pendingDraft: null,
      }
    }

    case 'setTM': {
      const tm: TrainingMax = {
        id: uid('tm'),
        userId: state.user.id,
        exerciseId: action.exerciseId,
        value: action.value,
        effectiveDate: new Date().toISOString().slice(0, 10),
      }
      return { ...state, trainingMaxes: [...state.trainingMaxes, tm] }
    }

    case 'logSet': {
      const others = state.setLogs.filter(
        (l) => !(l.slotId === action.log.slotId && l.setIndex === action.log.setIndex),
      )
      return { ...state, setLogs: [...others, action.log] }
    }

    case 'finishDay': {
      // Apply progression per main lift trained today.
      const slots = slotsForDay(state, action.week, action.day)
      let tms = state.trainingMaxes
      slots.forEach((slot) => {
        const ex = slot.exerciseId
        if (slot.progressionRule === 'none') return
        const logs = state.setLogs.filter((l) => l.slotId === slot.id)
        if (logs.length === 0) return
        const cat = ex.replace('ex-', '')
        const result = applyProgression(
          slot.progressionRule,
          slot.sets,
          logs,
          cat,
          state.user.units,
        )
        if (result.trainingMaxDelta !== 0) {
          const current = latestTM({ ...state, trainingMaxes: tms }, ex)
          tms = [
            ...tms,
            {
              id: uid('tm'),
              userId: state.user.id,
              exerciseId: ex,
              value: current + result.trainingMaxDelta,
              effectiveDate: new Date().toISOString().slice(0, 10),
            },
          ]
        }
      })
      const session: Session = {
        id: uid('sess'),
        userId: state.user.id,
        programId: state.activeProgramId,
        week: action.week,
        day: action.day,
        date: new Date().toISOString().slice(0, 10),
        status: 'complete',
      }
      return { ...state, trainingMaxes: tms, sessions: [...state.sessions, session] }
    }

    case 'advanceCycle': {
      const prog = state.programs.find((p) => p.id === state.activeProgramId)!
      const nextWeek = state.cycle.currentWeek + 1
      if (nextWeek > prog.lengthInWeeks) {
        return {
          ...state,
          cycle: {
            ...state.cycle,
            currentWeek: 1,
            currentCycle: state.cycle.currentCycle + 1,
            deloadFlag: false,
          },
        }
      }
      return { ...state, cycle: { ...state.cycle, currentWeek: nextWeek } }
    }

    case 'toggleBookmark': {
      const existing = state.bookmarks.find((b) => b.studyId === action.studyId)
      if (existing) return { ...state, bookmarks: state.bookmarks.filter((b) => b.id !== existing.id) }
      return {
        ...state,
        bookmarks: [...state.bookmarks, { id: uid('bm'), userId: state.user.id, studyId: action.studyId }],
      }
    }

    case 'logBodyWeight': {
      if (!Number.isFinite(action.value) || action.value <= 0) return state
      const entry: BodyWeight = {
        id: uid('bw'),
        date: new Date().toISOString().slice(0, 10),
        value: action.value,
      }
      // Replace today's entry if one exists.
      const others = state.bodyWeights.filter((b) => b.date !== entry.date)
      return { ...state, bodyWeights: [...others, entry] }
    }

    default:
      return state
  }
}

// ---- Context ---------------------------------------------------------------

interface Ctx {
  state: State
  dispatch: React.Dispatch<Action>
  // convenience
  weightFor: (slotId: string, setIndex: number) => number | null
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  const weightFor = (slotId: string, setIndex: number): number | null => {
    const slot = state.slots.find((s) => s.id === slotId)
    if (!slot) return null
    const scheme = slot.sets[setIndex]
    if (!scheme) return null
    const tm = latestTM(state, slot.exerciseId)
    return computeWeight(scheme, tm, state.user.units)
  }

  const value = useMemo(() => ({ state, dispatch, weightFor }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
