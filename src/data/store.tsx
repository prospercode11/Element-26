import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
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
import type { AuthUser } from './auth'
import type { ImportDraft } from './importParser'
import { parseImport } from './importParser'

// Collision-safe IDs: a short random suffix means IDs generated in a fresh
// session never clash with ones already living in a user's persisted state.
let counter = 1
function uid(p: string): string {
  const rand =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 0xffffffff).toString(16)
  return `${p}-${counter++}-${rand}`
}

const DAY_MS = 86_400_000

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

// A brand-new account starts completely empty — no preset program, exercises,
// training maxes, or history. The first-run tour and builder quiz guide the
// user to create their first program from scratch (or import one).
function emptyState(account: AuthUser): State {
  const user: User = {
    id: account.id,
    email: account.email,
    name: account.name,
    units: 'lb',
    isPro: false,
  }
  return {
    user,
    programs: [],
    activeProgramId: '',
    slots: [],
    trainingMaxes: [],
    sessions: [],
    setLogs: [],
    // A neutral cycle placeholder until the first program is created; it is
    // replaced with a real one on commitDraft.
    cycle: { id: uid('c'), programId: '', currentWeek: 1, currentCycle: 1, deloadFlag: false },
    bookmarks: [],
    bodyWeights: [],
    pendingDraft: null,
  }
}

const STATE_KEY_PREFIX = 'e26-state-'
const stateKey = (userId: string) => `${STATE_KEY_PREFIX}${userId}`

// Load a user's persisted state, or seed a fresh one. Guests are never read
// from storage — they always start clean.
function loadOrSeed(account: AuthUser, isGuest: boolean): State {
  if (!isGuest) {
    try {
      const raw = localStorage.getItem(stateKey(account.id))
      if (raw) {
        const parsed = JSON.parse(raw) as State
        // Keep identity fields in sync with the account of record.
        parsed.user = { ...parsed.user, id: account.id, email: account.email, name: account.name }
        return parsed
      }
    } catch {
      // Corrupt or unreadable — fall through to a fresh empty state.
    }
  }
  return emptyState(account)
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
      const prog = state.programs.find((p) => p.id === state.activeProgramId)
      if (!prog) return state
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

export function StoreProvider({
  account,
  isGuest = false,
  children,
}: {
  account: AuthUser
  isGuest?: boolean
  children: React.ReactNode
}) {
  const [state, dispatch] = useReducer(reducer, { account, isGuest }, ({ account, isGuest }) =>
    loadOrSeed(account, isGuest),
  )

  // Persist every change for real accounts. Guests are intentionally ephemeral.
  useEffect(() => {
    if (isGuest) return
    try {
      localStorage.setItem(stateKey(account.id), JSON.stringify(state))
    } catch {
      // Storage full or unavailable — non-fatal for the session.
    }
  }, [state, account.id, isGuest])

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
