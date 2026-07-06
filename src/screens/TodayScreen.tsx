import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Dumbbell,
  Flame,
  GalleryHorizontalEnd,
  Scale,
  Settings2,
  Timer,
  X,
} from 'lucide-react'
import { Banner, Card, EmptyState } from '../components/ui'
import ExercisePreview from '../components/ExercisePreview'
import Gloss from '../components/Gloss'
import {
  useStore,
  latestTM,
  slotsForDay,
  daysInProgram,
  tmHistory,
  computeStreak,
  latestBodyWeight,
} from '../data/store'
import { exerciseById } from '../data/mock'
import { applyProgression } from '../data/progression'
import type { MuscleGroup, ProgramSlot, SetLog } from '../data/types'

const CAT_LABEL: Record<string, string> = {
  squat: 'Squat', bench: 'Bench', deadlift: 'Deadlift', press: 'Press',
  back: 'Back', arms: 'Arms', legs: 'Legs', shoulders: 'Shoulders',
  chest: 'Chest', core: 'Core',
}

// Day labels come from the day's first programmed lift — not a hardcoded
// order — so imported/generated programs (nSuns starts on Bench, GZCLP on
// Squat) label correctly.
function dayLabel(slots: ProgramSlot[], day: number): string {
  const ex = exerciseById(slots[0]?.exerciseId ?? '')
  return ex ? CAT_LABEL[ex.category] ?? ex.name : `Day ${day}`
}

// The workout walkthrough auto-opens once per app load, after the tour closes.
let autoPreviewShown = false

export default function TodayScreen({
  tourActive = false,
  openBuild,
}: {
  tourActive?: boolean
  openBuild?: () => void
}) {
  const { state, dispatch, weightFor } = useStore()
  const week = state.cycle.currentWeek
  const days = daysInProgram(state)
  const [day, setDay] = useState(days[0] ?? 1)
  const [preview, setPreview] = useState(false)
  const slots = slotsForDay(state, week, day)

  useEffect(() => {
    if (!tourActive && !autoPreviewShown && slots.length > 0) {
      autoPreviewShown = true
      setPreview(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourActive])

  // Rest timer: starts on its own when a set is checked off.
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [, forceTick] = useState(0)
  useEffect(() => {
    if (restEnd === null) return
    const id = setInterval(() => forceTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [restEnd])
  const restLeft = restEnd === null ? 0 : Math.max(0, Math.ceil((restEnd - Date.now()) / 1000))
  useEffect(() => {
    if (restEnd !== null && restLeft === 0) setRestEnd(null)
  })

  // Accordion: one exercise open at a time; first block opens by default.
  const [openId, setOpenId] = useState<string | null>(null)
  useEffect(() => {
    setOpenId(slots[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, state.activeProgramId, week])

  const [finished, setFinished] = useState<string[] | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const doneCount = slots.reduce((acc, s) => {
    const logs = state.setLogs.filter((l) => l.slotId === s.id && l.completed)
    return acc + logs.length
  }, 0)
  const totalSets = slots.reduce((a, s) => a + s.sets.length, 0)

  // Muscle groups today's session trains, in program order.
  const muscles = useMemo(() => {
    const out: MuscleGroup[] = []
    slots.forEach((s) => {
      exerciseById(s.exerciseId)?.primaryMuscles.forEach((m) => {
        if (!out.includes(m)) out.push(m)
      })
    })
    return out
  }, [slots])

  const streak = computeStreak(state.sessions)
  const bw = latestBodyWeight(state)

  function finishDay() {
    // Build progression messages before dispatching (state is applied inside reducer).
    const msgs: string[] = []
    slots.forEach((slot) => {
      if (slot.progressionRule === 'none') return
      const logs = state.setLogs.filter((l) => l.slotId === slot.id)
      if (logs.length === 0) return
      const cat = slot.exerciseId.replace('ex-', '')
      const r = applyProgression(slot.progressionRule, slot.sets, logs, cat, state.user.units)
      const ex = exerciseById(slot.exerciseId)
      msgs.push(`${ex?.name}: ${r.message}`)
    })
    dispatch({ type: 'finishDay', week, day })
    setFinished(msgs.length ? msgs : ['Session logged. No auto-progression rules on today’s lifts.'])
  }

  if (state.programs.length === 0) {
    return (
      <div className="screen-pad">
        <div className="row spread" style={{ marginBottom: 10 }}>
          <h2 className="section">Today</h2>
          <span className="tiny faint">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <EmptyState
          icon={<Dumbbell size={30} />}
          title="No workout yet"
          body="You don't have a program yet. Build one in a few taps with the quick quiz, or import a spreadsheet — then your daily workout shows up here."
          actionLabel={openBuild ? 'Build my first program' : undefined}
          onAction={openBuild}
        />
      </div>
    )
  }

  if (finished) {
    return (
      <div className="screen-pad">
        <div className="row" style={{ gap: 10, margin: '6px 0 6px' }}>
          <CircleCheck size={26} color="var(--good)" />
          <h2 className="section" style={{ margin: 0 }}>Session complete</h2>
        </div>
        <p className="lead">Auto-progression applied to your training maxes:</p>
        {finished.map((m, i) => (
          <Banner key={i} kind="accent" icon={<Settings2 size={16} />}>{m}</Banner>
        ))}
        <button
          className="btn primary full mt12"
          onClick={() => {
            dispatch({ type: 'advanceCycle' })
            setFinished(null)
          }}
        >
          Advance to next session
          <ArrowRight size={17} />
        </button>
        <button className="btn ghost full mt8" onClick={() => setFinished(null)}>
          Back to logger
        </button>
      </div>
    )
  }

  return (
    <div className="screen-pad">
      {preview && <ExercisePreview slots={slots} onClose={() => setPreview(false)} />}

      <div className="row spread" style={{ marginBottom: 10 }}>
        <h2 className="section">Today</h2>
        <span className="tiny faint">
          {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* One hero: pick the day, see what it is, preview it, track it. */}
      <Card>
        <div className="seg">
          {days.map((d) => {
            const doneToday = state.sessions.some(
              (s) => s.status === 'complete' && s.date === today && s.day === d && s.week === week,
            )
            return (
              <button
                key={d}
                className={`${d === day ? 'active' : ''} ${doneToday ? 'done' : ''}`}
                onClick={() => setDay(d)}
              >
                {doneToday && <Check size={13} strokeWidth={2.5} />}
                {dayLabel(slotsForDay(state, week, d), d)}
              </button>
            )
          })}
        </div>
        <div className="row spread" style={{ alignItems: 'baseline' }}>
          <div className="wod-title">{dayLabel(slots, day)} Day</div>
          <span className="tiny faint pill-num">Cycle {state.cycle.currentCycle} · Week {week}</span>
        </div>
        <div className="wod-meta">
          {slots.length} exercise{slots.length === 1 ? '' : 's'} · {doneCount}/{totalSets} sets · {muscles.join(', ')}
        </div>
        <div className="row" style={{ gap: 12, marginTop: 14 }}>
          <div className="wod-progress" style={{ flex: 1, marginTop: 0 }}>
            <div style={{ width: `${totalSets ? (doneCount / totalSets) * 100 : 0}%` }} />
          </div>
          <button className="wod-open" onClick={() => setPreview(true)}>
            <GalleryHorizontalEnd size={14} />
            Preview
          </button>
        </div>
      </Card>

      <div className="stat-line">
        <span className="s-ico"><Flame size={13} /></span>
        <span><b>{streak}</b>-session streak</span>
        <span className="sep">·</span>
        <span className="s-ico"><Scale size={13} /></span>
        <span><b>{bw ? bw.value.toFixed(1) : '—'}</b> {state.user.units}</span>
      </div>

      {slots.map((slot) => (
        <SlotBlock
          key={slot.id}
          slot={slot}
          weightFor={weightFor}
          open={openId === slot.id}
          onToggle={() => setOpenId(openId === slot.id ? null : slot.id)}
          onSetCompleted={() => setRestEnd(Date.now() + 180_000)}
        />
      ))}

      <button className="btn primary full mt12" onClick={finishDay}>
        Finish session
      </button>

      {restEnd !== null && (
        <div className="rest-pill" role="timer" aria-label="rest timer">
          <Timer size={15} />
          Rest {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, '0')}
          <button onClick={() => setRestEnd(null)} aria-label="dismiss rest timer">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

function SlotBlock({
  slot,
  weightFor,
  open,
  onToggle,
  onSetCompleted,
}: {
  slot: ProgramSlot
  weightFor: (slotId: string, setIndex: number) => number | null
  open: boolean
  onToggle: () => void
  onSetCompleted: () => void
}) {
  const { state } = useStore()
  const ex = exerciseById(slot.exerciseId)
  const tm = latestTM(state, slot.exerciseId)

  const doneSets = state.setLogs.filter((l) => l.slotId === slot.id && l.completed).length
  const allDone = doneSets === slot.sets.length

  // "Last session" reference: working weight computed from the previous TM.
  const hist = tmHistory(state, slot.exerciseId)
  const prevTM = hist.length >= 2 ? hist[hist.length - 2].value : tm

  return (
    <Card className={open ? '' : 'tight'}>
      <button className="ex-toggle" onClick={onToggle} aria-expanded={open}>
        <div className="grow">
          <div style={{ fontSize: open ? 17 : 15, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {ex?.name ?? 'Unassigned lift'}
          </div>
          <div className="tiny faint" style={{ marginTop: 2 }}>{slot.label}</div>
        </div>
        <span className={`ex-count ${allDone ? 'done' : ''}`}>
          {allDone && <Check size={13} strokeWidth={2.5} />}
          {doneSets}/{slot.sets.length}
        </span>
        <span className="faint">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div className="ex-sets">
          <div className="tiny faint pill-num" style={{ textAlign: 'right', marginBottom: 8 }}>
            <Gloss term="tm">Training max</Gloss> {tm} {state.user.units}
          </div>
          {slot.sets.map((_, i) => (
            <SetRow
              key={i}
              slot={slot}
              setIndex={i}
              computed={weightFor(slot.id, i)}
              prevWeight={slot.sets[i].type === 'percent' ? Math.round((prevTM * slot.sets[i].value) / 100) : null}
              onCompleted={onSetCompleted}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

function SetRow({
  slot,
  setIndex,
  computed,
  prevWeight,
  onCompleted,
}: {
  slot: ProgramSlot
  setIndex: number
  computed: number | null
  prevWeight: number | null
  onCompleted: () => void
}) {
  const { state, dispatch } = useStore()
  const scheme = slot.sets[setIndex]
  const existing = state.setLogs.find((l) => l.slotId === slot.id && l.setIndex === setIndex)
  const [reps, setReps] = useState(existing?.reps ?? scheme.reps)
  const [rpe, setRpe] = useState<number | ''>(existing?.rpe ?? '')
  const done = existing?.completed ?? false

  function toggle() {
    const log: SetLog = {
      id: existing?.id ?? `log-${slot.id}-${setIndex}`,
      sessionId: 'active',
      exerciseId: slot.exerciseId,
      slotId: slot.id,
      setIndex,
      weight: computed ?? 0,
      targetReps: scheme.reps,
      reps: Number(reps),
      rpe: rpe === '' ? null : Number(rpe),
      completed: !done,
    }
    dispatch({ type: 'logSet', log })
    if (!done) onCompleted() // just finished a set → start the rest timer
  }

  const target =
    scheme.type === 'percent'
      ? `${scheme.value}% TM`
      : scheme.type === 'rpe'
        ? `RPE ${scheme.value}`
        : 'straight weight'

  return (
    <div className={`set-row ${done ? 'done' : ''}`}>
      <div className="set-idx">{setIndex + 1}</div>
      <div>
        <div className="set-prescribe">
          {computed ? `${computed} ${state.user.units}` : '—'}{' '}
          <span className="light">× {scheme.reps}</span>
          {scheme.amrap && (
            <Gloss term="amrap"><span className="amrap-tag">AMRAP</span></Gloss>
          )}
        </div>
        <div className="set-meta">
          {target}
          {prevWeight ? ` · last ${prevWeight} ${state.user.units}` : ''}
        </div>
        {done && (
          <div className="log-edit">
            <input
              className="mini-input"
              type="number"
              value={reps}
              aria-label="reps completed"
              onChange={(e) => {
                setReps(Number(e.target.value))
                dispatch({
                  type: 'logSet',
                  log: { ...(existing as SetLog), reps: Number(e.target.value) },
                })
              }}
            />
            <span>reps</span>
            <input
              className="mini-input"
              type="number"
              step="0.5"
              value={rpe}
              placeholder="—"
              aria-label="RPE"
              onChange={(e) => {
                const v = e.target.value === '' ? '' : Number(e.target.value)
                setRpe(v)
                dispatch({
                  type: 'logSet',
                  log: { ...(existing as SetLog), rpe: v === '' ? null : Number(v) },
                })
              }}
            />
            <Gloss term="rpe">RPE</Gloss>
          </div>
        )}
      </div>
      <button className={`set-check ${done ? 'done' : ''}`} onClick={toggle} aria-label="complete set">
        {done ? <Check size={19} strokeWidth={2.5} /> : <span style={{ width: 19 }} />}
      </button>
    </div>
  )
}

