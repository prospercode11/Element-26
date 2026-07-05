import React, { useState } from 'react'
import { X } from 'lucide-react'

// Tap-to-explain jargon. The term renders with a dotted underline; tapping it
// opens a bottom sheet with a plain-language definition. Keeps the UI clean
// for experienced lifters while staying learnable for beginners.

const DEFS = {
  tm: {
    title: 'Training Max (TM)',
    body: 'The reference number your working weights are calculated from — roughly 90% of the most you could lift once with good form. You never lift your true max in training; every “65% TM”-style set is a percentage of this number. It rises automatically as you progress.',
  },
  amrap: {
    title: 'AMRAP set',
    body: '“As Many Reps As Possible.” On this set, don’t stop at the target number — keep going until you couldn’t do another clean rep. The app reads your result to decide how fast your weights should climb.',
  },
  rpe: {
    title: 'RPE (effort, 1–10)',
    body: 'Rating of Perceived Exertion. 10 = you couldn’t have done one more rep; 8 = you had two left in the tank. Logging it after a set helps the app spot fatigue building up and time your recovery weeks.',
  },
} as const

export type GlossTerm = keyof typeof DEFS

export default function Gloss({
  term,
  children,
}: {
  term: GlossTerm
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const def = DEFS[term]

  return (
    <>
      <button
        className="gloss"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label={`what does ${def.title} mean?`}
      >
        {children}
      </button>
      {open && (
        <div className="overlay sheet-bottom" onClick={() => setOpen(false)} role="dialog">
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: 8 }}>
              <b style={{ fontFamily: 'var(--font-display)', fontSize: 16.5 }}>{def.title}</b>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="close">
                <X size={16} />
              </button>
            </div>
            <p className="small muted" style={{ lineHeight: 1.65 }}>{def.body}</p>
          </div>
        </div>
      )}
    </>
  )
}
