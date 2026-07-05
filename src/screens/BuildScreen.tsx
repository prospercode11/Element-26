import { useState } from 'react'
import {
  Blocks,
  Eye,
  FileSpreadsheet,
  Info,
  ListChecks,
  LoaderCircle,
  Lock,
  Target,
  TriangleAlert,
} from 'lucide-react'
import { Banner, Card } from '../components/ui'
import { useStore, latestTM } from '../data/store'
import { EXERCISES, exerciseById } from '../data/mock'
import { SAMPLE_PASTES } from '../data/importParser'
import { PROGRESSION_RULES } from '../data/progression'
import type { SchemeType } from '../data/types'

type Sub = 'import' | 'builder' | 'maxes'

export default function BuildScreen({
  openPaywall,
  openQuiz,
}: {
  openPaywall: () => void
  openQuiz?: () => void
}) {
  const [sub, setSub] = useState<Sub>('import')
  return (
    <div className="screen-pad">
      <h2 className="section">Program Builder</h2>
      <p className="lead">Paste a spreadsheet or build a scheme visually — zero scripting.</p>
      {openQuiz && (
        <button className="btn full" style={{ marginBottom: 14 }} onClick={openQuiz}>
          <ListChecks size={16} />
          Not sure what to run? Take the quiz
        </button>
      )}
      <div className="row wrap" style={{ marginBottom: 16 }}>
        <button className={`chip tap ${sub === 'import' ? 'active' : ''}`} onClick={() => setSub('import')}>
          <FileSpreadsheet size={14} /> Import
        </button>
        <button className={`chip tap ${sub === 'builder' ? 'active' : ''}`} onClick={() => setSub('builder')}>
          <Blocks size={14} /> Visual builder
        </button>
        <button className={`chip tap ${sub === 'maxes' ? 'active' : ''}`} onClick={() => setSub('maxes')}>
          <Target size={14} /> Training maxes
        </button>
      </div>
      {sub === 'import' && <ImportTab openPaywall={openPaywall} />}
      {sub === 'builder' && <BuilderTab />}
      {sub === 'maxes' && <MaxesTab />}
    </div>
  )
}

// ---- AI Import --------------------------------------------------------------

function ImportTab({ openPaywall }: { openPaywall: () => void }) {
  const { state, dispatch } = useStore()
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [parsing, setParsing] = useState(false)
  const draft = state.pendingDraft

  function draftProgram() {
    // Simulate the server-side structuring pass so the loading state is honest.
    setParsing(true)
    window.setTimeout(() => {
      dispatch({ type: 'draftImport', text })
      setParsing(false)
    }, 700)
  }

  return (
    <>
      {!draft && (
        <Card>
          <div className="field">
            <label>Paste a program — 5/3/1, nSuns, GZCLP, or any percentage table</label>
            <textarea
              value={text}
              placeholder={'Wendler 5/3/1 BBB\nWeek 1: 65% x5, 75% x5, 85% x5+ …'}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="tiny faint" style={{ marginBottom: 8 }}>Or start from a sample:</div>
          <div className="row wrap" style={{ marginBottom: 14 }}>
            {SAMPLE_PASTES.map((s) => (
              <button key={s.label} className="chip tap" onClick={() => setText(s.text)}>
                {s.label}
              </button>
            ))}
          </div>
          <button
            className="btn primary full"
            disabled={text.trim().length < 3 || parsing}
            onClick={draftProgram}
          >
            {parsing ? (
              <>
                <LoaderCircle size={17} className="spin" />
                Analyzing structure…
              </>
            ) : (
              'Draft my program'
            )}
          </button>
          <div className="tiny faint mt12" style={{ lineHeight: 1.55 }}>
            The draft is structured for review — nothing saves until you approve it. Screenshots
            work too: the production pipeline runs OCR first, then the same parser.
          </div>
        </Card>
      )}

      {draft && (
        <>
          <Card>
            <div className="row spread" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {draft.detected}
              </div>
              <span className={`chip ${draft.confidence === 'high' ? 'active' : ''}`}>
                {draft.confidence} confidence
              </span>
            </div>
            <div className="row" style={{ gap: 22, marginBottom: 4 }}>
              <div><div className="tiny faint">Weeks</div><b className="pill-num">{draft.lengthInWeeks}</b></div>
              <div><div className="tiny faint">Days / week</div><b className="pill-num">{draft.daysPerWeek}</b></div>
              <div><div className="tiny faint">Blocks</div><b className="pill-num">{draft.slots.length}</b></div>
            </div>
          </Card>

          {draft.notes.map((n, i) => (
            <Banner key={i} kind="warn" icon={<TriangleAlert size={15} />}>{n}</Banner>
          ))}

          <Card title="Drafted structure — review before saving">
            {groupByWeekDay(draft.slots).map(({ week, day, items }) => (
              <div key={`${week}-${day}`} style={{ marginBottom: 14 }}>
                <div className="tag-topic" style={{ marginBottom: 8 }}>
                  Week {week} · Day {day}
                </div>
                {items.map((s, i) => {
                  const ex = exerciseById(s.exerciseId)
                  return (
                    <div key={i} className="set-row" style={{ gridTemplateColumns: '1fr' }}>
                      <div>
                        <div className="set-prescribe" style={{ fontSize: 14.5 }}>
                          {ex?.name ?? 'Assign a lift'} <span className="light">— {s.label}</span>
                        </div>
                        <div className="set-meta">
                          {summarizeSets(s.sets)} · rule: {ruleLabel(s.progressionRule)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </Card>

          <div className="field">
            <label>Program name</label>
            <input type="text" value={name} placeholder={draft.detected} onChange={(e) => setName(e.target.value)} />
          </div>

          {!state.user.isPro && (
            <Banner kind="warn" icon={<Lock size={15} />}>
              Spreadsheet import is a <b>Pro</b> feature. The free tier includes full logging and
              one custom program.
            </Banner>
          )}
          <button
            className="btn primary full"
            onClick={() => {
              if (!state.user.isPro) return openPaywall()
              dispatch({ type: 'commitDraft', name })
            }}
          >
            {state.user.isPro ? 'Save program & make it active' : 'Unlock import to save'}
          </button>
          <button className="btn ghost full mt8" onClick={() => dispatch({ type: 'clearDraft' })}>
            Discard draft
          </button>
        </>
      )}
    </>
  )
}

// ---- Visual builder ---------------------------------------------------------

function BuilderTab() {
  const { state } = useStore()
  const prog = state.programs.find((p) => p.id === state.activeProgramId)!
  const slots = state.slots.filter((s) => s.programId === prog.id)

  return (
    <>
      <SlotEditor />
      <Card title={`${prog.name} — current structure`}>
        {groupByWeekDay(slots.map((s) => s)).map(({ week, day, items }) => (
          <div key={`${week}-${day}`} style={{ marginBottom: 12 }}>
            <div className="tag-topic" style={{ marginBottom: 4 }}>Week {week} · Day {day}</div>
            {items.map((s, i) => {
              const ex = exerciseById(s.exerciseId)
              return (
                <div key={i} className="kv">
                  <span className="k">{ex?.name} <span className="faint">· {s.label}</span></span>
                  <span className="v small">{summarizeSets(s.sets)}</span>
                </div>
              )
            })}
          </div>
        ))}
      </Card>
    </>
  )
}

// A live, no-code scheme editor (local preview — demonstrates the builder UX).
function SlotEditor() {
  const { state } = useStore()
  const [exId, setExId] = useState(EXERCISES[0].id)
  const [schemeType, setSchemeType] = useState<SchemeType>('percent')
  const [value, setValue] = useState(85)
  const [reps, setReps] = useState(5)
  const [sets, setSets] = useState(3)
  const [rule, setRule] = useState(PROGRESSION_RULES[0].id)

  const tm = latestTM(state, exId)
  const preview =
    schemeType === 'percent'
      ? `${sets}×${reps} at ${value}% → ${Math.round((tm * value) / 100)} ${state.user.units}`
      : schemeType === 'rpe'
        ? `${sets}×${reps} at RPE ${value}`
        : `${sets}×${reps} at ${value} ${state.user.units}`

  return (
    <Card title="Add a set scheme">
      <div className="field">
        <label>Lift</label>
        <select value={exId} onChange={(e) => setExId(e.target.value)}>
          {EXERCISES.map((e) => (
            <option key={e.id} value={e.id}>{e.name}{e.isMainLift ? ' (main)' : ''}</option>
          ))}
        </select>
      </div>
      <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Scheme</label>
          <select value={schemeType} onChange={(e) => setSchemeType(e.target.value as SchemeType)}>
            <option value="percent">% of training max</option>
            <option value="rpe">Target RPE</option>
            <option value="weight">Straight weight</option>
          </select>
        </div>
        <div className="field" style={{ width: 88 }}>
          <label>{schemeType === 'percent' ? 'Percent' : schemeType === 'rpe' ? 'RPE' : 'Load'}</label>
          <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Sets</label>
          <input type="number" value={sets} onChange={(e) => setSets(Number(e.target.value))} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Reps</label>
          <input type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))} />
        </div>
      </div>
      <div className="field">
        <label>Progression rule</label>
        <select value={rule} onChange={(e) => setRule(e.target.value as any)}>
          {PROGRESSION_RULES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <div className="tiny faint mt8" style={{ lineHeight: 1.5 }}>
          {PROGRESSION_RULES.find((r) => r.id === rule)?.blurb}
        </div>
      </div>
      <Banner kind="accent" icon={<Eye size={15} />}>
        <b>Live preview:</b> {preview}
      </Banner>
    </Card>
  )
}

// ---- Training maxes ---------------------------------------------------------

function MaxesTab() {
  const { state, dispatch } = useStore()
  const mains = EXERCISES.filter((e) => e.isMainLift)
  return (
    <>
      <Banner kind="info" icon={<Info size={16} />}>
        Every working weight in the app is computed from these. Set each training max to roughly
        90% of a true 1RM.
      </Banner>
      {mains.map((ex) => {
        const tm = latestTM(state, ex.id)
        return (
          <Card key={ex.id} className="tight">
            <div className="row spread">
              <div style={{ fontWeight: 650 }}>{ex.name}</div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn sm" aria-label={`decrease ${ex.name} training max`} onClick={() => dispatch({ type: 'setTM', exerciseId: ex.id, value: tm - (state.user.units === 'kg' ? 2.5 : 5) })}>−</button>
                <div className="pill-num" style={{ minWidth: 64, textAlign: 'center', fontWeight: 700 }}>{tm} {state.user.units}</div>
                <button className="btn sm" aria-label={`increase ${ex.name} training max`} onClick={() => dispatch({ type: 'setTM', exerciseId: ex.id, value: tm + (state.user.units === 'kg' ? 2.5 : 5) })}>+</button>
              </div>
            </div>
          </Card>
        )
      })}
      <button
        className="btn full mt8"
        onClick={() => dispatch({ type: 'setUnits', units: state.user.units === 'lb' ? 'kg' : 'lb' })}
      >
        Switch units to {state.user.units === 'lb' ? 'kg' : 'lb'}
      </button>
    </>
  )
}

// ---- helpers ---------------------------------------------------------------

function groupByWeekDay<T extends { week: number; day: number }>(slots: T[]) {
  const map = new Map<string, { week: number; day: number; items: T[] }>()
  slots.forEach((s) => {
    const key = `${s.week}-${s.day}`
    if (!map.has(key)) map.set(key, { week: s.week, day: s.day, items: [] })
    map.get(key)!.items.push(s)
  })
  return [...map.values()].sort((a, b) => a.week - b.week || a.day - b.day)
}

function summarizeSets(sets: { type: SchemeType; value: number; reps: number; amrap?: boolean }[]): string {
  if (sets.length === 0) return '—'
  // Collapse identical schemes into "N×(scheme)".
  const parts = sets.map((s) =>
    s.type === 'percent' ? `${s.value}%×${s.reps}${s.amrap ? '+' : ''}` :
    s.type === 'rpe' ? `RPE${s.value}×${s.reps}` : `${s.value}×${s.reps}`,
  )
  const uniform = parts.every((p) => p === parts[0])
  return uniform ? `${sets.length}×(${parts[0]})` : parts.join(', ')
}

function ruleLabel(id: string): string {
  return PROGRESSION_RULES.find((r) => r.id === id)?.label ?? id
}
