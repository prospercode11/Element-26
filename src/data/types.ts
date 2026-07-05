// ---------------------------------------------------------------------------
// Element 26 — plain-English data model, expressed in TypeScript.
// Mirrors the schema in the product spec. IDs are strings for the prototype.
// ---------------------------------------------------------------------------

export type Units = 'lb' | 'kg'

export interface User {
  id: string
  email: string
  units: Units
  isPro: boolean
}

export type ProgramSource = 'imported' | 'custom'

export interface Program {
  id: string
  userId: string
  name: string
  lengthInWeeks: number
  daysPerWeek: number
  source: ProgramSource
  // A short note describing where an imported program came from.
  importNote?: string
}

export type ExerciseCategory =
  | 'squat'
  | 'bench'
  | 'deadlift'
  | 'press'
  | 'back'
  | 'arms'
  | 'legs'
  | 'shoulders'
  | 'chest'
  | 'core'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  isMainLift: boolean
  primaryMuscles: MuscleGroup[]
  biomechanicalNotes: string
}

// A per-set prescription. Exactly one of the three "type"s drives the weight.
export type SchemeType = 'percent' | 'rpe' | 'weight'

export interface SetScheme {
  type: SchemeType
  // percent -> % of training max; rpe -> target RPE; weight -> absolute load
  value: number
  reps: number
  // last set is an AMRAP ("as many reps as possible") set
  amrap?: boolean
}

export type ProgressionRuleId =
  | 'none'
  | 'linear-add' // +X next session if all reps hit
  | 'tm-cycle-bump' // raise TM each cycle (5/3/1 style)
  | 'amrap-autoreg' // adjust TM based on AMRAP reps vs. target
  | 'gzclp-stage' // stage progression w/ deload on repeated failure

export interface ProgramSlot {
  id: string
  programId: string
  week: number
  day: number
  exerciseId: string
  sets: SetScheme[]
  progressionRule: ProgressionRuleId
  label?: string // e.g. "Main — Ohp", "BBB 5x10"
}

export interface TrainingMax {
  id: string
  userId: string
  exerciseId: string
  value: number
  effectiveDate: string // ISO date
}

export type SessionStatus = 'upcoming' | 'active' | 'complete'

export interface Session {
  id: string
  userId: string
  programId: string
  week: number
  day: number
  date: string // ISO date
  status: SessionStatus
}

export interface SetLog {
  id: string
  sessionId: string
  exerciseId: string
  slotId: string
  setIndex: number
  weight: number
  targetReps: number
  reps: number | null
  rpe: number | null
  completed: boolean
}

export interface BodyWeight {
  id: string
  date: string // ISO date
  value: number
}

export interface CycleState {
  id: string
  programId: string
  currentWeek: number
  currentCycle: number
  deloadFlag: boolean
}

// ---- Science / research -----------------------------------------------------

export type EvidenceScore = 'meta-analysis' | 'rct' | 'observational'

export type Topic =
  | 'hypertrophy'
  | 'strength'
  | 'recovery'
  | 'nutrition'
  | 'tendon'
  | 'technique'
  | 'programming'

export type StudyDesign =
  | 'meta-analysis'
  | 'systematic-review'
  | 'rct'
  | 'crossover'
  | 'cohort'
  | 'observational'

export interface StudySummary {
  id: string
  title: string
  journal: string
  year: number
  topicTags: Topic[]
  studyDesign: StudyDesign
  sampleNotes: string // n, training status, sex, etc.
  plainSummary: string // what was tested / found
  caveats: string
  evidenceScore: EvidenceScore
  trainingStatus: 'trained' | 'untrained' | 'mixed'
}

export interface Bookmark {
  id: string
  userId: string
  studyId: string
}

// ---- Science coaching tips --------------------------------------------------

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'calves'

// Evidence-based weekly volume landmarks (working sets / week).
export interface VolumeLandmark {
  muscle: MuscleGroup
  mev: number // minimum effective volume
  mav: number // maximum adaptive volume (mid of the productive range)
  mrv: number // maximum recoverable volume
}

export interface CoachingTip {
  id: string
  title: string
  body: string
  topic: Topic
  evidenceScore: EvidenceScore
  citation: string
  // shows this tip when the user's program touches these categories
  relevantTo: ExerciseCategory[]
}
