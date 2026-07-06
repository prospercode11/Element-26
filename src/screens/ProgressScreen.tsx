import { useState } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import { Card, EmptyState } from '../components/ui'
import { useStore, latestTM, tmHistory, latestBodyWeight } from '../data/store'
import { EXERCISES } from '../data/mock'
import { estimated1RM } from '../data/progression'

export default function ProgressScreen({ openBuild }: { openBuild?: () => void }) {
  const { state } = useStore()
  const prog = state.programs.find((p) => p.id === state.activeProgramId)
  const mains = EXERCISES.filter((e) => e.isMainLift)

  if (!prog) {
    return (
      <div className="screen-pad">
        <h2 className="section">Progress</h2>
        <p className="lead">Training-max history, estimated 1RM trend, and where you are in the cycle.</p>
        <EmptyState
          icon={<TrendingUp size={30} />}
          title="No history yet"
          body="Once you create a program and start logging sessions, your training-max trend and cycle position show up here."
          actionLabel={openBuild ? 'Build a program' : undefined}
          onAction={openBuild}
        />
      </div>
    )
  }

  return (
    <div className="screen-pad">
      <h2 className="section">Progress</h2>
      <p className="lead">Training-max history, estimated 1RM trend, and where you are in the cycle.</p>

      <CycleTracker
        weeks={prog.lengthInWeeks}
        week={state.cycle.currentWeek}
        cycle={state.cycle.currentCycle}
        deload={state.cycle.deloadFlag}
      />

      <BodyWeightCard />

      {mains.map((ex) => {
        const hist = tmHistory(state, ex.id)
        const tm = latestTM(state, ex.id)
        if (hist.length === 0) return null
        const first = hist[0].value
        const delta = tm - first
        // TM ≈ 90% of 1RM, so est 1RM ≈ TM / 0.9
        const e1rm = Math.round(tm / 0.9)
        return (
          <Card key={ex.id}>
            <div className="row spread" style={{ marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>
                  {ex.name}
                </div>
                <div className="tiny faint pill-num" style={{ marginTop: 2 }}>
                  est. 1RM ≈ {e1rm} {state.user.units} · TM {tm} {state.user.units}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="tiny faint">since start</div>
                <div className="pill-num" style={{ fontWeight: 700, color: delta >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                  {delta >= 0 ? '+' : ''}{delta} {state.user.units}
                </div>
              </div>
            </div>
            <Spark values={hist.map((h) => h.value)} />
            <div className="row spread tiny faint pill-num" style={{ marginTop: 6 }}>
              <span>{hist[0].effectiveDate}</span>
              <span>{hist.length} data points</span>
              <span>{hist[hist.length - 1].effectiveDate}</span>
            </div>
          </Card>
        )
      })}

      <Card title="Estimated 1RMs from logged sets">
        <div className="tiny faint" style={{ marginBottom: 10, lineHeight: 1.5 }}>
          Epley formula on your best logged set per lift this session.
        </div>
        {state.setLogs.filter((l) => l.completed && l.reps).length === 0 && (
          <div className="faint small">Log sets in Today to populate this.</div>
        )}
        {bestByExercise(state).map(({ exId, name, e1rm, weight, reps }) => (
          <div key={exId} className="kv">
            <span className="k">{name} <span className="faint pill-num">· {weight}×{reps}</span></span>
            <span className="v">{e1rm} {state.user.units}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

function BodyWeightCard() {
  const { state, dispatch } = useStore()
  const [input, setInput] = useState('')
  const entries = [...state.bodyWeights].sort((a, b) => a.date.localeCompare(b.date))
  const latest = latestBodyWeight(state)
  const first = entries[0]
  const delta = latest && first && first.id !== latest.id ? latest.value - first.value : null

  function add() {
    const v = parseFloat(input)
    if (!Number.isFinite(v) || v <= 0) return
    dispatch({ type: 'logBodyWeight', value: v })
    setInput('')
  }

  return (
    <Card title="Body weight">
      <div className="row spread" style={{ marginBottom: 10 }}>
        <div>
          <div className="pill-num" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
            {latest ? latest.value.toFixed(1) : '—'}{' '}
            <span className="small faint" style={{ fontWeight: 500 }}>{state.user.units}</span>
          </div>
          <div className="tiny faint" style={{ marginTop: 2 }}>
            {entries.length} entries · weekly weigh-ins
          </div>
        </div>
        {delta !== null && (
          <div style={{ textAlign: 'right' }}>
            <div className="tiny faint">since first entry</div>
            <div className="pill-num" style={{ fontWeight: 700, color: 'var(--text)' }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)} {state.user.units}
            </div>
          </div>
        )}
      </div>
      {entries.length >= 2 && <Spark values={entries.map((e) => e.value)} />}
      <div className="row mt12" style={{ gap: 8 }}>
        <input
          type="number"
          step="0.1"
          placeholder={`Today’s weight (${state.user.units})`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          aria-label="log body weight"
        />
        <button className="btn sm" onClick={add} disabled={!input.trim()} style={{ flexShrink: 0, padding: '12px 14px' }}>
          <Plus size={15} />
          Log
        </button>
      </div>
    </Card>
  )
}

function CycleTracker({ weeks, week, cycle, deload }: { weeks: number; week: number; cycle: number; deload: boolean }) {
  return (
    <Card title="Mesocycle tracker">
      <div className="row spread" style={{ marginBottom: 12 }}>
        <span className="chip active">Cycle {cycle}</span>
        <span className="faint small">{deload ? 'Deload scheduled' : 'Accumulation'}</span>
      </div>
      <div className="row" style={{ gap: 6, alignItems: 'flex-start' }}>
        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
          <div key={w} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                height: 6, borderRadius: 3,
                background: w < week ? 'var(--good)' : w === week ? 'var(--ember)' : 'var(--surface-2)',
              }}
            />
            <div className="tiny faint mt8">W{w}</div>
          </div>
        ))}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-2)', border: '1px dashed var(--line-strong)' }} />
          <div className="tiny faint mt8">Deload</div>
        </div>
      </div>
    </Card>
  )
}

// Minimal dependency-free sparkline.
function Spark({ values }: { values: number[] }) {
  const w = 320, h = 90, pad = 6
  if (values.length < 2) return <div className="faint small">Not enough history.</div>
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return [x, y]
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--ember)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke="var(--ember)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--ember)" />
      ))}
    </svg>
  )
}

function bestByExercise(state: ReturnType<typeof useStore>['state']) {
  const byEx = new Map<string, { weight: number; reps: number; e1rm: number }>()
  state.setLogs
    .filter((l) => l.completed && l.reps && l.weight)
    .forEach((l) => {
      const e = estimated1RM(l.weight, l.reps!)
      const cur = byEx.get(l.exerciseId)
      if (!cur || e > cur.e1rm) byEx.set(l.exerciseId, { weight: l.weight, reps: l.reps!, e1rm: e })
    })
  return [...byEx.entries()].map(([exId, v]) => ({
    exId,
    name: EXERCISES.find((e) => e.id === exId)?.name ?? exId,
    ...v,
  }))
}
