// Minimal line-art pictograms for each exercise — consistent stroke, round
// caps, body in the current text color, bar/load in the ember accent. Each
// figure loops a gentle motion hinting at the movement pattern (the moving
// part sits in a .fig-* group; keyframes live in styles.css).

const BODY = {
  stroke: 'currentColor',
  strokeWidth: 5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
}
const LOAD = {
  stroke: 'var(--ember)',
  strokeWidth: 5,
  strokeLinecap: 'round' as const,
  fill: 'none',
}

function Ground() {
  return <line x1={24} y1={126} x2={176} y2={126} stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.18} />
}

export default function ExerciseFigure({ exerciseId }: { exerciseId: string }) {
  return (
    <svg viewBox="0 0 200 140" role="img" aria-label="exercise motion diagram">
      <Ground />
      {pick(exerciseId)}
    </svg>
  )
}

function pick(id: string) {
  switch (id) {
    case 'ex-squat': return <Squat />
    case 'ex-bench': return <Bench />
    case 'ex-deadlift': return <Deadlift />
    case 'ex-ohp': return <Press />
    case 'ex-row': return <Row />
    case 'ex-pullup': return <PullUp />
    case 'ex-rdl': return <RDL />
    case 'ex-incline': return <Incline />
    case 'ex-curl': return <Curl />
    default: return <Generic />
  }
}

// Front view — the whole body sinks and stands back up.
function Squat() {
  return (
    <g className="fig-squash">
      <line x1={42} y1={54} x2={158} y2={54} {...LOAD} />
      <circle cx={42} cy={54} r={12} {...LOAD} />
      <circle cx={158} cy={54} r={12} {...LOAD} />
      <circle cx={100} cy={34} r={9} {...BODY} />
      <path d="M100 47 L100 80" {...BODY} />
      <path d="M100 56 L78 54 M100 56 L122 54" {...BODY} />
      <path d="M100 80 L81 100 L87 124" {...BODY} />
      <path d="M100 80 L119 100 L113 124" {...BODY} />
    </g>
  )
}

// Side view — the bar lowers to the chest and presses back up.
function Bench() {
  return (
    <g>
      <line x1={48} y1={102} x2={148} y2={102} stroke="currentColor" strokeWidth={5} strokeLinecap="round" opacity={0.4} />
      <path d="M60 102 L60 124 M136 102 L136 124" stroke="currentColor" strokeWidth={4} strokeLinecap="round" opacity={0.4} fill="none" />
      <circle cx={56} cy={92} r={8} {...BODY} />
      <path d="M67 95 L126 95" {...BODY} />
      <path d="M126 95 L142 110 L142 124" {...BODY} />
      <path d="M94 95 L94 64" {...BODY} />
      <g className="fig-updown" style={{ ['--amp' as string]: '10px' }}>
        <line x1={72} y1={60} x2={116} y2={60} {...LOAD} />
        <circle cx={72} cy={60} r={10} {...LOAD} />
        <circle cx={116} cy={60} r={10} {...LOAD} />
      </g>
    </g>
  )
}

// Side view — the bar breaks off the floor and lowers back down.
function Deadlift() {
  return (
    <g>
      <g className="fig-updown" style={{ ['--amp' as string]: '-14px' }}>
        <circle cx={126} cy={104} r={16} {...LOAD} />
        <circle cx={126} cy={104} r={3} fill="var(--ember)" stroke="none" />
      </g>
      <path d="M106 124 L111 92" {...BODY} />
      <path d="M111 92 L95 72" {...BODY} />
      <path d="M95 72 L124 52" {...BODY} />
      <circle cx={132} cy={45} r={8} {...BODY} />
      <path d="M119 55 L126 98" {...BODY} />
    </g>
  )
}

// Front view — the bar dips to the shoulders and locks back out.
function Press() {
  return (
    <g>
      <g className="fig-updown" style={{ ['--amp' as string]: '12px' }}>
        <line x1={50} y1={28} x2={150} y2={28} {...LOAD} />
        <circle cx={50} cy={28} r={11} {...LOAD} />
        <circle cx={150} cy={28} r={11} {...LOAD} />
      </g>
      <circle cx={100} cy={48} r={8} {...BODY} />
      <path d="M100 58 L79 31 M100 58 L121 31" {...BODY} />
      <path d="M100 58 L100 92" {...BODY} />
      <path d="M100 92 L88 124 M100 92 L112 124" {...BODY} />
    </g>
  )
}

// Side view — the bar rows up to the ribs and back down.
function Row() {
  return (
    <g>
      <path d="M88 124 L93 96" {...BODY} />
      <path d="M93 96 L86 74" {...BODY} />
      <path d="M86 74 L118 54" {...BODY} />
      <circle cx={126} cy={48} r={8} {...BODY} />
      <path d="M112 58 L105 84" {...BODY} />
      <g className="fig-updown" style={{ ['--amp' as string]: '-12px' }}>
        <circle cx={104} cy={90} r={11} {...LOAD} />
      </g>
    </g>
  )
}

// Front view — the body pulls up toward the bar and lowers under control.
function PullUp() {
  return (
    <g>
      <line x1={44} y1={24} x2={156} y2={24} {...LOAD} />
      <path d="M78 26 L92 54 M122 26 L108 54" {...BODY} />
      <g className="fig-updown" style={{ ['--amp' as string]: '-9px' }}>
        <circle cx={100} cy={44} r={8} {...BODY} />
        <path d="M100 54 L100 88" {...BODY} />
        <path d="M100 88 L93 112 M100 88 L107 112" {...BODY} />
      </g>
    </g>
  )
}

// Side view — the bar slides down the thighs and drives back up.
function RDL() {
  return (
    <g>
      <path d="M100 124 L102 86" {...BODY} />
      <path d="M102 86 L128 64" {...BODY} />
      <circle cx={135} cy={57} r={8} {...BODY} />
      <path d="M122 68 L107 100" {...BODY} />
      <g className="fig-updown" style={{ ['--amp' as string]: '-12px' }}>
        <circle cx={106} cy={106} r={11} {...LOAD} />
      </g>
    </g>
  )
}

// Side view — pressing up and away off a 30–45° bench.
function Incline() {
  return (
    <g>
      <line x1={60} y1={110} x2={118} y2={64} stroke="currentColor" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
      <path d="M88 90 L88 124" stroke="currentColor" strokeWidth={4} strokeLinecap="round" opacity={0.35} fill="none" />
      <path d="M70 102 L112 68" {...BODY} />
      <circle cx={120} cy={59} r={8} {...BODY} />
      <path d="M70 102 L64 124" {...BODY} />
      <path d="M99 79 L112 46" {...BODY} />
      <g className="fig-updown" style={{ ['--amp' as string]: '8px' }}>
        <circle cx={115} cy={41} r={9} {...LOAD} />
      </g>
    </g>
  )
}

// Side view — the forearm hinges at the elbow, dumbbell curling up and down.
function Curl() {
  return (
    <g>
      <circle cx={97} cy={44} r={8} {...BODY} />
      <path d="M97 54 L97 92" {...BODY} />
      <path d="M97 92 L91 124 M97 92 L103 124" {...BODY} />
      <path d="M97 60 L110 78" {...BODY} />
      <g className="fig-curl">
        <path d="M110 78 L104 56" {...BODY} />
        <line x1={98} y1={53} x2={112} y2={59} {...LOAD} />
        <circle cx={98} cy={53} r={5} fill="var(--ember)" stroke="none" />
        <circle cx={112} cy={59} r={5} fill="var(--ember)" stroke="none" />
      </g>
    </g>
  )
}

// Fallback — a dumbbell.
function Generic() {
  return (
    <g className="fig-updown" style={{ ['--amp' as string]: '-8px' }}>
      <line x1={70} y1={80} x2={130} y2={80} {...LOAD} />
      <rect x={56} y={64} width={14} height={32} rx={4} {...LOAD} />
      <rect x={130} y={64} width={14} height={32} rx={4} {...LOAD} />
    </g>
  )
}
