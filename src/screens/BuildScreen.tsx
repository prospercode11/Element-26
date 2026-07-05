import { useState } from 'react'
import {
  Blocks,
  Eye,
  FileSpreadsheet,
  Info,
  ListChecks,
  LoaderCircle,
  Lock,
  Sparkles,
  SlidersHorizontal,
  Target,
  TriangleAlert,
} from 'lucide-react'
import { Banner, Card } from '../components/ui'
import Gloss from '../components/Gloss'
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
      <Banner kind="info" icon={<Info size={16} />}>
        <b>New here? Three ways to get a program:</b> <b>Import</b> pastes one in for you
        (paste a spreadsheet or a program name and it reads it). <b>Visual builder</b> lets
        you tap together sets and reps by hand. <b>Training maxes</b> are the numbers
        everything else is calculated from — worth setting first if you're starting from
        scratch.
      </Banner>
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
          <div className="tiny faint" style={{ lineHeight: 1.6, marginBottom: 12 }}>
            <b>How this works:</b> (1) paste a program below — a full spreadsheet, or just
            its name, (2) tap "Draft my program" and the app structures it into weeks, days,
            and sets, (3) review the draft and save it. Nothing is saved until you approve it.
          </div>
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
            Screenshots work too: the production pipeline runs OCR first, then the same parser.
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

// Beginner-friendly presets — plain-language names standing in for raw numbers.
const INTENSITY_PRESETS: { label: string; value: number; blurb: string }[] = [
  { label: 'Light', value: 65, blurb: 'An easier weight — good for warming up or a recovery day.' },
  { label: 'Moderate', value: 75, blurb: 'A solid working weight. Most sets in a program sit here.' },
  { label: 'Heavy', value: 85, blurb: 'A challenging top set — this is where most strength is built.' },
]
const REP_PRESETS: { label: string; sets: number; reps: number; blurb: string }[] = [
  { label: '5 × 5 — Strength', sets: 5, reps: 5, blurb: 'Heavier weight, fewer reps — builds raw strength.' },
  { label: '3 × 8 — Size', sets: 3, reps: 8, blurb: 'Moderate weight, more reps — good for muscle growth.' },
  { label: '3 × 10 — Size', sets: 3, reps: 10, blurb: 'Lighter and higher-rep — also builds muscle, easier on joints.' },
]

// A live, no-code scheme editor (local preview — demonstrates the builder UX).
function SlotEditor() {
  const { state } = useStore()
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple')
  const [exId, setExId] = useState(EXERCISES[0].id)
  const [schemeType, setSchemeType] = useState<SchemeType>('percent')
  const [value, setValue] = useState(85)
  const [reps, setReps] = useState(5)
  const [sets, setSets] = useState(3)
  const [amrap, setAmrap] = useState(false)
  const [rule, setRule] = useState(PROGRESSION_RULES[0].id)

  const tm = latestTM(state, exId)
  const repsLabel = `${reps}${amrap ? '+' : ''}`
  const preview =
    schemeType === 'percent'
      ? `${sets}×${repsLabel} at ${value}% → ${Math.round((tm * value) / 100)} ${state.user.units}`
      : schemeType === 'rpe'
        ? `${sets}×${repsLabel} at RPE ${value}`
        : `${sets}×${repsLabel} at ${value} ${state.user.units}`

  return (
    <Card title="Add a set scheme">
      <div className="tiny faint" style={{ lineHeight: 1.5, marginBottom: 12 }}>
        A <Gloss term="scheme">set scheme</Gloss> is just how a lift gets loaded on a given
        day: which lift, how heavy, how many sets and reps, and how it grows over time.
      </div>

      <div className="row wrap" style={{ marginBottom: 14 }}>
        <button
          className={`chip tap ${mode === 'simple' ? 'active' : ''}`}
          onClick={() => setMode('simple')}
        >
          <Sparkles size={14} /> Simple
        </button>
        <button
          className={`chip tap ${mode === 'advanced' ? 'active' : ''}`}
          onClick={() => setMode('advanced')}
        >
          <SlidersHorizontal size={14} /> Advanced (exact numbers)
        </button>
      </div>

      <div className="field">
        <label>Step 1 — Which lift?</label>
        <select value={exId} onChange={(e) => setExId(e.target.value)}>
          {EXERCISES.map((e) => (
            <option key={e.id} value={e.id}>{e.name}{e.isMainLift ? ' (main)' : ''}</option>
          ))}
        </select>
      </div>

      {mode === 'simple' ? (
        <>
          <div className="field">
            <label>Step 2 — How heavy?</label>
            <div className="row wrap" style={{ marginBottom: 6 }}>
              {INTENSITY_PRESETS.map((p) => (
                <button
                  key={p.label}
                  className={`chip tap ${schemeType === 'percent' && value === p.value ? 'active' : ''}`}
                  onClick={() => {
                    setSchemeType('percent')
                    setValue(p.value)
                  }}
                >
                  {p.label} ({p.value}%)
                </button>
              ))}
            </div>
            <div className="tiny faint">
              {INTENSITY_PRESETS.find((p) => p.value === value)?.blurb ?? 'A percent of your training max.'}
            </div>
          </div>

          <div className="field">
            <label>Step 3 — How many sets and reps?</label>
            <div className="row wrap" style={{ marginBottom: 6 }}>
              {REP_PRESETS.map((p) => (
                <button
                  key={p.label}
                  className={`chip tap ${sets === p.sets && reps === p.reps ? 'active' : ''}`}
                  onClick={() => {
                    setSets(p.sets)
                    setReps(p.reps)
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="tiny faint">
              {REP_PRESETS.find((p) => p.sets === sets && p.reps === reps)?.blurb ??
                'Pick a rep range, or fine-tune it in Advanced mode.'}
            </div>
          </div>

          <label className="row" style={{ gap: 8, marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={amrap} onChange={(e) => setAmrap(e.target.checked)} />
            <span className="tiny">
              Make the last set an <Gloss term="amrap">AMRAP</Gloss> (go until you can't)
            </span>
          </label>
        </>
      ) : (
        <>
          <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Step 2 — <Gloss term="scheme">Scheme</Gloss></label>
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
              <label>Step 3 — Sets</label>
              <input type="number" value={sets} onChange={(e) => setSets(Number(e.target.value))} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Reps</label>
              <input type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))} />
            </div>
          </div>
          <label className="row" style={{ gap: 8, marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={amrap} onChange={(e) => setAmrap(e.target.checked)} />
            <span className="tiny">
              Last set is an <Gloss term="amrap">AMRAP</Gloss> (go until you can't)
            </span>
          </label>
        </>
      )}

      <div className="field">
        <label>Step 4 — <Gloss term="progression">How should it grow over time?</Gloss></label>
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
        Every working weight in the app is computed from these — not sure what a{' '}
        <Gloss term="tm">training max</Gloss> is? Tap it. Don't know your true max? A safe
        starting guess is a weight you could lift for about 5 solid reps, times roughly 1.15.
        You can always nudge it up or down with the +/− buttons below as you get a feel for it.
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
