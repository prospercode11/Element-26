import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, CircleCheck, Library, TriangleAlert } from 'lucide-react'
import { Banner, Card, EvidenceBadge } from '../components/ui'
import { useStore } from '../data/store'
import { COACHING_TIPS, EXERCISES, VOLUME_LANDMARKS, exerciseById } from '../data/mock'
import type { ExerciseCategory, MuscleGroup } from '../data/types'

export default function ScienceScreen() {
  const { state } = useStore()

  // Categories present in the active program → drives tip relevance.
  const activeCats = useMemo(() => {
    const cats = new Set<ExerciseCategory>()
    state.slots
      .filter((s) => s.programId === state.activeProgramId)
      .forEach((s) => {
        const ex = exerciseById(s.exerciseId)
        if (ex) cats.add(ex.category)
      })
    return cats
  }, [state.slots, state.activeProgramId])

  // Weekly working-sets per muscle, averaged across the program's weeks.
  const weeklyVolume = useMemo(() => {
    const prog = state.programs.find((p) => p.id === state.activeProgramId)
    if (!prog) return {} as Partial<Record<MuscleGroup, number>>
    const totals: Partial<Record<MuscleGroup, number>> = {}
    state.slots
      .filter((s) => s.programId === prog.id)
      .forEach((slot) => {
        const ex = exerciseById(slot.exerciseId)
        if (!ex) return
        ex.primaryMuscles.forEach((m) => {
          totals[m] = (totals[m] ?? 0) + slot.sets.length
        })
      })
    const perWeek: Partial<Record<MuscleGroup, number>> = {}
    Object.entries(totals).forEach(([m, v]) => {
      perWeek[m as MuscleGroup] = Math.round((v as number) / prog.lengthInWeeks)
    })
    return perWeek
  }, [state.slots, state.activeProgramId, state.programs])

  const tips = COACHING_TIPS.filter((t) => t.relevantTo.some((c) => activeCats.has(c)))

  return (
    <div className="screen-pad">
      <h2 className="section">Science Coaching</h2>
      <p className="lead">Guidance from current meta-analyses, tuned to the program you’re running.</p>

      <DeloadCard />

      <Card title="Weekly volume vs. evidence-based landmarks">
        <div className="tiny faint" style={{ marginBottom: 14, lineHeight: 1.5 }}>
          Working sets per muscle per week from{' '}
          <b style={{ color: 'var(--text-2)' }}>
            {state.programs.find((p) => p.id === state.activeProgramId)?.name}
          </b>
          , benchmarked against MEV → MAV → MRV.
        </div>
        {VOLUME_LANDMARKS.filter((l) => (weeklyVolume[l.muscle] ?? 0) > 0).map((l) => (
          <VolumeBar key={l.muscle} muscle={l.muscle} sets={weeklyVolume[l.muscle] ?? 0} landmark={l} />
        ))}
        {Object.keys(weeklyVolume).length === 0 && (
          <div className="faint small">No sets programmed yet.</div>
        )}
        <div className="divider" />
        <div className="tiny faint" style={{ lineHeight: 1.55 }}>
          Under MEV: not enough stimulus to grow. MEV–MAV: the productive range. Past MRV: more
          than you can recover from.
        </div>
      </Card>

      <div className="tag-topic" style={{ margin: '18px 0 10px' }}>Tips for your program</div>
      {tips.map((t) => (
        <Card key={t.id}>
          <div className="row spread" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 650, fontSize: 15.5, lineHeight: 1.35 }}>{t.title}</div>
            <EvidenceBadge score={t.evidenceScore} />
          </div>
          <div className="small muted" style={{ lineHeight: 1.6 }}>{t.body}</div>
          <div className="row tiny faint mt12" style={{ gap: 6 }}>
            <Library size={13} />
            {t.citation}
          </div>
        </Card>
      ))}

      <ExerciseLibrary />
    </div>
  )
}

function VolumeBar({
  muscle,
  sets,
  landmark,
}: {
  muscle: MuscleGroup
  sets: number
  landmark: { mev: number; mav: number; mrv: number }
}) {
  const pct = Math.min(100, (sets / landmark.mrv) * 100)
  let status: 'under' | 'optimal' | 'high' | 'over'
  let note: string
  if (sets < landmark.mev) { status = 'under'; note = `below MEV (${landmark.mev})` }
  else if (sets <= landmark.mav) { status = 'optimal'; note = 'productive range' }
  else if (sets <= landmark.mrv) { status = 'high'; note = 'near MRV — watch fatigue' }
  else { status = 'over'; note = `over MRV (${landmark.mrv})` }

  return (
    <div className="vol-row">
      <div className="vol-head">
        <span className="muscle">{muscle}</span>
        <span className="count">{sets} sets · {note}</span>
      </div>
      <div className="vol-track">
        <div className={`vol-fill ${status}`} style={{ width: `${Math.max(6, pct)}%` }} />
      </div>
      <div className="vol-ticks">
        <span>0</span><span>MEV {landmark.mev}</span><span>MAV {landmark.mav}</span><span>MRV {landmark.mrv}</span>
      </div>
    </div>
  )
}

// Deload driven by accumulated fatigue signals, not a fixed calendar.
function DeloadCard() {
  const { state } = useStore()

  const signals = useMemo(() => {
    const logs = state.setLogs
    const rpes = logs.map((l) => l.rpe).filter((r): r is number => r !== null)
    const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0
    const missed = logs.filter((l) => l.completed && l.reps !== null && l.reps < l.targetReps).length
    const weekDepth = state.cycle.currentWeek // later in the wave = more accumulated fatigue
    // 0–100 fatigue score.
    let score = 0
    score += Math.max(0, avgRpe - 7) * 14 // RPE creep above 7
    score += missed * 16
    score += (weekDepth - 1) * 18
    score += (state.cycle.currentCycle - 1) * 6
    return { score: Math.min(100, Math.round(score)), avgRpe, missed, weekDepth }
  }, [state.setLogs, state.cycle])

  const recommend = signals.score >= 60
  return (
    <Card title="Fatigue & deload readiness">
      <div className="vol-track" style={{ height: 12 }}>
        <div
          className={`vol-fill ${signals.score >= 60 ? 'over' : signals.score >= 35 ? 'high' : 'optimal'}`}
          style={{ width: `${Math.max(6, signals.score)}%` }}
        />
      </div>
      <div className="vol-ticks"><span>fresh</span><span>accumulating</span><span>deload</span></div>
      <div className="row" style={{ gap: 20, margin: '14px 0' }}>
        <div><div className="tiny faint">Avg logged RPE</div><b className="pill-num">{signals.avgRpe ? signals.avgRpe.toFixed(1) : '—'}</b></div>
        <div><div className="tiny faint">Missed-rep sets</div><b className="pill-num">{signals.missed}</b></div>
        <div><div className="tiny faint">Cycle depth</div><b className="pill-num">C{state.cycle.currentCycle} · W{signals.weekDepth}</b></div>
      </div>
      <Banner
        kind={recommend ? 'warn' : 'good'}
        icon={recommend ? <TriangleAlert size={16} /> : <CircleCheck size={16} />}
      >
        {recommend
          ? 'Fatigue signals are elevated — RPE creep, missed reps, cycle depth. A deload within the next 1–2 sessions is warranted. Triggered by your data, not a fixed calendar.'
          : 'Fatigue is within a productive range. No deload needed yet — keep logging RPE so this stays accurate.'}
      </Banner>
    </Card>
  )
}

function ExerciseLibrary() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <div className="tag-topic" style={{ margin: '18px 0 10px' }}>Exercise library — biomechanics</div>
      {EXERCISES.map((ex) => (
        <Card key={ex.id} className="tight">
          <button
            className="row spread"
            style={{ width: '100%', textAlign: 'left', padding: 0 }}
            onClick={() => setOpen(open === ex.id ? null : ex.id)}
            aria-expanded={open === ex.id}
          >
            <div>
              <div style={{ fontWeight: 650, fontSize: 14.5 }}>{ex.name}</div>
              <div className="tiny faint" style={{ marginTop: 2 }}>{ex.primaryMuscles.join(' · ')}</div>
            </div>
            <span className="faint">
              {open === ex.id ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </span>
          </button>
          {open === ex.id && (
            <div className="small muted mt12" style={{ lineHeight: 1.6 }}>{ex.biomechanicalNotes}</div>
          )}
        </Card>
      ))}
    </>
  )
}
