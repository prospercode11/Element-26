import { useState } from 'react'
import {
  ArrowRight,
  Dumbbell,
  FileSpreadsheet,
  FlaskConical,
  TrendingUp,
} from 'lucide-react'
import { LogoBadge } from './ui'

// First-launch walkthrough. Plain language, one idea per slide — assumes the
// reader has never used a percentage-based program before.
const SLIDES: { icon: React.ReactNode; title: string; body: string }[] = [
  {
    icon: <span style={{ transform: 'scale(1.3)' }}><LogoBadge /></span>,
    title: 'Welcome to Element 26',
    body: 'Your lifting program lives here — no spreadsheet at the gym. The app tells you exactly what to lift today, tracks it, and makes you stronger over time.',
  },
  {
    icon: <Dumbbell size={30} />,
    title: 'Today is your workout',
    body: 'Every set shows the exact weight to put on the bar — already calculated for you. Tap the circle when you finish a set, and a rest timer starts on its own.',
  },
  {
    icon: <TrendingUp size={30} />,
    title: 'It progresses for you',
    body: 'Hit your reps and finish the session — next time the weights go up automatically. Miss reps? The plan adapts instead of punishing you.',
  },
  {
    icon: <FileSpreadsheet size={30} />,
    title: 'Bring any program',
    body: 'Already following a plan from a spreadsheet? Paste it in the Build tab and it becomes a structured program in seconds. Or build one visually.',
  },
  {
    icon: <FlaskConical size={30} />,
    title: 'Science, graded honestly',
    body: 'Coaching tips and studies carry evidence tags, so you always know how solid a claim is. Confused by a term like TM or RPE? Tap any dotted word for a plain explanation.',
  },
]

export default function Tour({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const slide = SLIDES[i]
  const last = i === SLIDES.length - 1

  return (
    <div className="overlay tour" role="dialog" aria-label="app tour">
      <div className="sheet">
        <div className="slide" key={i}>
          <div className="tour-ico">{slide.icon}</div>
          <h3>{slide.title}</h3>
          <p>{slide.body}</p>
        </div>

        <div className="dots" style={{ justifyContent: 'center', margin: '20px 0 16px' }}>
          {SLIDES.map((_, d) => (
            <span key={d} className={`dot ${d === i ? 'active' : ''}`} />
          ))}
        </div>

        <button
          className="btn primary full"
          onClick={() => (last ? onClose() : setI(i + 1))}
        >
          {last ? 'Start lifting' : 'Next'}
          {!last && <ArrowRight size={16} />}
        </button>
        {!last && (
          <button className="btn ghost full mt8" onClick={onClose}>
            Skip tour
          </button>
        )}
      </div>
    </div>
  )
}
