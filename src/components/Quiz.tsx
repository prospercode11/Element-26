import { useState } from 'react'
import { ArrowRight, Check, ChevronLeft, FileSpreadsheet, LoaderCircle, Sparkles, TrendingUp } from 'lucide-react'
import { useStore } from '../data/store'
import { SAMPLE_PASTES } from '../data/importParser'
import { generateProgram, mainLiftTMs } from '../data/ai'

// Onboarding quiz: four taps → a recommended, ready-to-run program built from
// the same templates the importer understands. Runs once after the tour.

type Answers = {
  exp?: 'new' | 'months' | 'mid' | 'adv'
  goal?: 'muscle' | 'strength' | 'fat' | 'fit'
  days?: '3' | '4' | '5'
  hasPlan?: 'yes' | 'no'
}

const QUESTIONS: {
  id: keyof Answers
  q: string
  opts: { v: string; label: string; hint?: string }[]
}[] = [
  {
    id: 'exp',
    q: 'How long have you been lifting?',
    opts: [
      { v: 'new', label: 'Brand new', hint: 'never followed a program' },
      { v: 'months', label: 'A few months' },
      { v: 'mid', label: '1–3 years' },
      { v: 'adv', label: '3+ years' },
    ],
  },
  {
    id: 'goal',
    q: 'What’s your main goal?',
    opts: [
      { v: 'muscle', label: 'Build muscle' },
      { v: 'strength', label: 'Get stronger' },
      { v: 'fat', label: 'Lose fat', hint: 'keep muscle while dieting' },
      { v: 'fit', label: 'Stay fit & healthy' },
    ],
  },
  {
    id: 'days',
    q: 'How many days a week can you train?',
    opts: [
      { v: '3', label: '3 days' },
      { v: '4', label: '4 days' },
      { v: '5', label: '5 or more' },
    ],
  },
  {
    id: 'hasPlan',
    q: 'Do you already follow a program?',
    opts: [
      { v: 'yes', label: 'Yes — I want to import it', hint: 'from a spreadsheet or screenshot' },
      { v: 'no', label: 'No — build one for me' },
    ],
  },
]

function recommend(a: Answers): { template: string; label: string; why: string[] } {
  if (a.exp === 'new' || a.exp === 'months') {
    return {
      template: 'GZCLP',
      label: 'GZCLP',
      why: [
        'Linear progression — the weight on the bar goes up nearly every session, which is exactly what works when you’re newer.',
        'Built-in fallback stages when reps stall, so you never have to guess what to do next.',
        a.days === '3'
          ? 'Works on 3 days a week: just do the next day in the rotation each time you train.'
          : 'Four focused days: squat, press, deadlift, bench.',
      ],
    }
  }
  if (a.goal === 'strength') {
    return {
      template: 'nSuns 5/3/1',
      label: 'nSuns 5/3/1',
      why: [
        'High pressing and pulling frequency — a proven favorite for intermediate strength gains.',
        'A weekly AMRAP top set auto-adjusts your training maxes to your actual performance.',
        'Volume where it matters, autoregulated so you don’t burn out.',
      ],
    }
  }
  return {
    template: '5/3/1 BBB',
    label: '5/3/1 Boring But Big',
    why: [
      'Heavy main lifts keep your strength moving up in simple 3-week waves.',
      '5×10 supplemental volume is the muscle-building engine.',
      'Training maxes bump automatically at the end of each cycle.',
    ],
  }
}

function goalNote(a: Answers): string | null {
  switch (a.goal) {
    case 'fat':
      return 'Training stays heavy so you keep muscle while your diet drives the fat loss. Track your body weight on the Progress tab.'
    case 'muscle':
      return 'Pair it with enough protein (~1.6 g/kg/day) — the Science tab has the evidence.'
    default:
      return null
  }
}

export default function Quiz({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: () => void
}) {
  const { state, dispatch } = useStore()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [busy, setBusy] = useState(false)
  const atResult = step >= QUESTIONS.length

  function pick(id: keyof Answers, v: string) {
    setAnswers((prev) => ({ ...prev, [id]: v }))
    window.setTimeout(() => setStep((s) => s + 1), 180)
  }

  // Fall back to the template library if AI generation isn't available or fails.
  function createFromTemplate() {
    const rec = recommend(answers)
    const tpl = SAMPLE_PASTES.find((s) => s.label === rec.template)
    if (tpl) {
      dispatch({ type: 'draftImport', text: tpl.text })
      dispatch({ type: 'commitDraft', name: rec.label })
    }
    onClose()
  }

  // Primary path: generate a personalized program with Claude (via our proxy).
  async function createPlan() {
    if (busy) return
    setBusy(true)
    try {
      const draft = await generateProgram({
        answers: answers as Record<string, string>,
        units: state.user.units,
        trainingMaxes: mainLiftTMs(state),
      })
      dispatch({ type: 'setDraft', draft })
      dispatch({ type: 'commitDraft', name: draft.detected })
      setBusy(false)
      onClose()
    } catch {
      // Couldn't reach the AI service — quietly build from a proven template.
      setBusy(false)
      createFromTemplate()
    }
  }

  return (
    <div className="overlay tour" role="dialog" aria-label="training plan quiz">
      <div className="sheet">
        {!atResult ? (
          <div className="slide" key={step}>
            <div className="row spread" style={{ marginBottom: 14 }}>
              <button
                className="icon-btn"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                aria-label="back"
                style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="tiny faint">{step + 1} of {QUESTIONS.length}</span>
              <span style={{ width: 36 }} />
            </div>
            <div className="quiz-q">{QUESTIONS[step].q}</div>
            {QUESTIONS[step].opts.map((o) => {
              const selected = answers[QUESTIONS[step].id] === o.v
              return (
                <button
                  key={o.v}
                  className={`quiz-opt ${selected ? 'selected' : ''}`}
                  onClick={() => pick(QUESTIONS[step].id, o.v)}
                >
                  <span>
                    {o.label}
                    {o.hint && <span className="tiny faint" style={{ display: 'block', fontWeight: 450 }}>{o.hint}</span>}
                  </span>
                  {selected && <span className="tick"><Check size={17} strokeWidth={2.5} /></span>}
                </button>
              )
            })}
            <button className="btn ghost full mt8" onClick={onClose}>
              Skip for now
            </button>
          </div>
        ) : answers.hasPlan === 'yes' ? (
          <div className="slide" style={{ textAlign: 'center' }}>
            <div className="tour-ico"><FileSpreadsheet size={30} /></div>
            <h3>Bring your program over</h3>
            <p>
              Paste your spreadsheet in Build → Import and it becomes a structured,
              auto-progressing plan on your phone — nothing to retype.
            </p>
            <button className="btn primary full" style={{ marginTop: 20 }} onClick={onImport}>
              Go to Import
              <ArrowRight size={16} />
            </button>
            <button className="btn ghost full mt8" onClick={onClose}>
              Maybe later
            </button>
          </div>
        ) : (
          <ResultSlide answers={answers} onCreate={createPlan} onClose={onClose} busy={busy} />
        )}
      </div>
    </div>
  )
}

function ResultSlide({
  answers,
  onCreate,
  onClose,
  busy,
}: {
  answers: Answers
  onCreate: () => void
  onClose: () => void
  busy: boolean
}) {
  const rec = recommend(answers)
  const note = goalNote(answers)
  return (
    <div className="slide" style={{ textAlign: 'center' }}>
      <div className="tour-ico"><TrendingUp size={30} /></div>
      <h3>Your plan: {rec.label}</h3>
      <div className="mt12" style={{ textAlign: 'left' }}>
        {rec.why.map((w, i) => (
          <div key={i} className="why-row">
            <Check size={15} strokeWidth={2.5} />
            <span>{w}</span>
          </div>
        ))}
      </div>
      {note && (
        <p className="tiny faint" style={{ marginTop: 6, lineHeight: 1.55 }}>{note}</p>
      )}
      <button className="btn primary full" style={{ marginTop: 18 }} onClick={onCreate} disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle size={16} className="spin" />
            Building your program…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate my plan with AI
          </>
        )}
      </button>
      <button className="btn ghost full mt8" onClick={onClose} disabled={busy}>
        I’ll pick later
      </button>
    </div>
  )
}
