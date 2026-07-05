import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import ExerciseFigure from './ExerciseFigure'
import { EXERCISES } from '../data/mock'
import type { ProgramSlot, SetScheme } from '../data/types'

// Slideshow preview of today's workout: one slide per programmed block —
// what the exercise looks like, which muscles it trains, and the set scheme.
export default function ExercisePreview({
  slots,
  onClose,
}: {
  slots: ProgramSlot[]
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const slot = slots[index]
  const ex = EXERCISES.find((e) => e.id === slot?.exerciseId)
  if (!slot) return null

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(slots.length - 1, i + 1))

  return (
    <div className="overlay" role="dialog" aria-label="workout preview">
      <div className="sheet">
        <div className="sheet-head">
          <span className="sh-title">
            Today’s workout · {index + 1} of {slots.length}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="close preview">
            <X size={17} />
          </button>
        </div>

        <div className="slide" key={index}>
          <div className="figure-panel">
            <ExerciseFigure exerciseId={slot.exerciseId} />
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {ex?.name ?? 'Unassigned lift'}
          </div>
          <div className="tiny faint" style={{ marginTop: 2 }}>{slot.label}</div>

          <div className="row wrap" style={{ gap: 6, margin: '12px 0' }}>
            {(ex?.primaryMuscles ?? []).map((m) => (
              <span key={m} className="muscle-tag">{m}</span>
            ))}
          </div>

          <div className="kv" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <span className="k">Set scheme</span>
            <span className="v small">{summarize(slot.sets)}</span>
          </div>

          {ex && (
            <div className="small muted mt8" style={{ lineHeight: 1.55 }}>
              {ex.biomechanicalNotes}
            </div>
          )}
        </div>

        <div className="slide-nav">
          <button className="icon-btn" onClick={prev} disabled={index === 0} aria-label="previous exercise"
            style={{ opacity: index === 0 ? 0.35 : 1 }}>
            <ChevronLeft size={18} />
          </button>
          <div className="dots">
            {slots.map((_, i) => (
              <span key={i} className={`dot ${i === index ? 'active' : ''}`} />
            ))}
          </div>
          <button className="icon-btn" onClick={next} disabled={index === slots.length - 1} aria-label="next exercise"
            style={{ opacity: index === slots.length - 1 ? 0.35 : 1 }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="tiny faint" style={{ textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          This is today’s plan. Close this and check off sets as you lift —
          the weights are already worked out for you.
        </div>
      </div>
    </div>
  )
}

function summarize(sets: SetScheme[]): string {
  if (sets.length === 0) return '—'
  const parts = sets.map((s) =>
    s.type === 'percent' ? `${s.value}%×${s.reps}${s.amrap ? '+' : ''}` :
    s.type === 'rpe' ? `RPE${s.value}×${s.reps}` : `${s.value}×${s.reps}`,
  )
  const uniform = parts.every((p) => p === parts[0])
  return uniform ? `${sets.length}×(${parts[0]})` : parts.join(', ')
}
