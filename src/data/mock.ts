import type {
  CoachingTip,
  Exercise,
  StudySummary,
  VolumeLandmark,
} from './types'

// ---- Exercise library with biomechanical notes -----------------------------

export const EXERCISES: Exercise[] = [
  {
    id: 'ex-squat',
    name: 'Back Squat',
    category: 'squat',
    isMainLift: true,
    primaryMuscles: ['quads', 'glutes'],
    biomechanicalNotes:
      'Knee-dominant. Longer moment arm at the hip with a low bar / forward torso, at the knee with high bar. Deep, controlled bottom position loads the quads in a lengthened state — a driver of stretch-mediated hypertrophy. High stability demand limits per-set fatigue economy vs. leg press.',
  },
  {
    id: 'ex-bench',
    name: 'Bench Press',
    category: 'bench',
    isMainLift: true,
    primaryMuscles: ['chest', 'triceps', 'shoulders'],
    biomechanicalNotes:
      'Pec moment arm peaks near mid-range with elbows tucked ~45°. A wider grip increases pec stretch but shortens ROM and raises shoulder stress. Retracted, arched setup shortens ROM and improves stability/force output at the cost of pec lengthening.',
  },
  {
    id: 'ex-deadlift',
    name: 'Deadlift',
    category: 'deadlift',
    isMainLift: true,
    primaryMuscles: ['hamstrings', 'glutes', 'back'],
    biomechanicalNotes:
      'Hip-dominant. Large spinal-erector demand; hamstrings work largely isometrically (little length change) so hypertrophy stimulus for hams is modest despite heavy loading. High systemic fatigue — the single biggest deload driver in most programs.',
  },
  {
    id: 'ex-ohp',
    name: 'Overhead Press',
    category: 'press',
    isMainLift: true,
    primaryMuscles: ['shoulders', 'triceps'],
    biomechanicalNotes:
      'Anterior/lateral delt dominant with triceps lockout. Moment arm on the delts is largest with the bar in front of the face at mid-range. Standing variants add core stability demand that caps loadable weight relative to seated.',
  },
  {
    id: 'ex-row',
    name: 'Barbell Row',
    category: 'back',
    isMainLift: false,
    primaryMuscles: ['back', 'biceps'],
    biomechanicalNotes:
      'Lats + mid-back. Torso angle sets the resistance profile: more horizontal loads the mid-back/rhomboids; more upright shifts toward upper traps. Peak lat tension occurs near full contraction.',
  },
  {
    id: 'ex-pullup',
    name: 'Pull-Up',
    category: 'back',
    isMainLift: false,
    primaryMuscles: ['back', 'biceps'],
    biomechanicalNotes:
      'Lats loaded in a strong stretch at the bottom hang. Grip width has a small effect on lat activation; the larger driver of lat growth is full-ROM reps from a dead hang.',
  },
  {
    id: 'ex-rdl',
    name: 'Romanian Deadlift',
    category: 'legs',
    isMainLift: false,
    primaryMuscles: ['hamstrings', 'glutes'],
    biomechanicalNotes:
      'Loads the hamstrings in a lengthened position through hip flexion with soft knees — strong stretch-mediated stimulus, unlike the flat-back conventional pull. Long hip moment arm makes it lower-back demanding.',
  },
  {
    id: 'ex-incline',
    name: 'Incline Bench Press',
    category: 'chest',
    isMainLift: false,
    primaryMuscles: ['chest', 'shoulders', 'triceps'],
    biomechanicalNotes:
      '30–45° bench biases the clavicular (upper) pec and front delt. Steeper angles progressively trade pec for delt involvement.',
  },
  {
    id: 'ex-curl',
    name: 'Dumbbell Curl',
    category: 'arms',
    isMainLift: false,
    primaryMuscles: ['biceps'],
    biomechanicalNotes:
      'Biceps moment arm peaks ~90° elbow flexion. Incline/behind-the-body variations bias the long head by adding shoulder extension and biceps stretch.',
  },
]

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id)
}

// ---- Evidence-based weekly volume landmarks (working sets / week) -----------
// Ranges reflect commonly cited hypertrophy landmarks for trained lifters.

export const VOLUME_LANDMARKS: VolumeLandmark[] = [
  { muscle: 'chest', mev: 8, mav: 16, mrv: 22 },
  { muscle: 'back', mev: 10, mav: 18, mrv: 25 },
  { muscle: 'quads', mev: 8, mav: 14, mrv: 20 },
  { muscle: 'hamstrings', mev: 6, mav: 12, mrv: 16 },
  { muscle: 'glutes', mev: 6, mav: 12, mrv: 16 },
  { muscle: 'shoulders', mev: 8, mav: 16, mrv: 26 },
  { muscle: 'biceps', mev: 8, mav: 14, mrv: 20 },
  { muscle: 'triceps', mev: 6, mav: 12, mrv: 18 },
  { muscle: 'calves', mev: 8, mav: 14, mrv: 20 },
]

// ---- Science coaching tips (with evidence tags + citations) -----------------

export const COACHING_TIPS: CoachingTip[] = [
  {
    id: 'tip-freq',
    title: 'Hit each muscle ≥2×/week',
    body: 'For a matched weekly volume, spreading sets across 2+ sessions modestly beats once-weekly for hypertrophy — largely by letting you accumulate quality volume with less per-session fatigue.',
    topic: 'programming',
    evidenceScore: 'meta-analysis',
    citation: 'Schoenfeld, Ogborn & Krieger (2016), Sports Medicine — frequency meta-analysis.',
    relevantTo: ['squat', 'bench', 'deadlift', 'press', 'back'],
  },
  {
    id: 'tip-doseresponse',
    title: 'More sets → more growth, with diminishing returns',
    body: 'Weekly set volume shows a dose–response with hypertrophy up to a point; ~10+ sets/muscle/week clearly beats fewer, but returns flatten and recovery cost rises past your MAV.',
    topic: 'hypertrophy',
    evidenceScore: 'meta-analysis',
    citation: 'Schoenfeld et al. (2017), J Sports Sciences — dose-response meta-analysis.',
    relevantTo: ['bench', 'squat', 'back', 'press'],
  },
  {
    id: 'tip-stretch',
    title: 'Train the lengthened position',
    body: 'Emphasizing the stretched portion of the ROM (deep squats, RDLs, incline curls) appears to favor hypertrophy over partials biased to the shortened range.',
    topic: 'hypertrophy',
    evidenceScore: 'rct',
    citation: 'Maeo et al. (2021/2023) — lengthened-partials & full-ROM trials.',
    relevantTo: ['squat', 'legs', 'arms', 'chest'],
  },
  {
    id: 'tip-proximity',
    title: 'You don’t need to train to failure every set',
    body: 'Leaving 1–3 reps in reserve captures most of the growth stimulus with far less fatigue than training to failure on compounds. Reserve true failure for isolation work.',
    topic: 'programming',
    evidenceScore: 'meta-analysis',
    citation: 'Grgic et al. (2022) — proximity-to-failure meta-analysis.',
    relevantTo: ['squat', 'deadlift', 'bench', 'press'],
  },
  {
    id: 'tip-tendon',
    title: 'Tendons adapt slower than muscle',
    body: 'Connective tissue remodels on a longer timeline than muscle and strength. Sudden TM jumps outpace tendon adaptation — a reason to cap load increases and program deloads.',
    topic: 'tendon',
    evidenceScore: 'observational',
    citation: 'Reviews on tendon mechanobiology (Bohm et al., 2015).',
    relevantTo: ['deadlift', 'squat', 'bench'],
  },
  {
    id: 'tip-protein',
    title: '~1.6 g/kg/day protein is enough for most',
    body: 'Protein intake beyond ~1.6 g/kg/day yields little additional hypertrophy benefit for most trained lifters; distribution across meals matters less than hitting the daily total.',
    topic: 'nutrition',
    evidenceScore: 'meta-analysis',
    citation: 'Morton et al. (2018), Br J Sports Med — protein meta-analysis.',
    relevantTo: ['squat', 'bench', 'deadlift', 'press'],
  },
]

// ---- Research feed / study database -----------------------------------------

export const STUDIES: StudySummary[] = [
  {
    id: 'st-1',
    title: 'Resistance training frequency and hypertrophy: an updated meta-analysis',
    journal: 'Sports Medicine',
    year: 2019,
    topicTags: ['hypertrophy', 'programming'],
    studyDesign: 'meta-analysis',
    sampleNotes: 'Pooled trials; mix of trained and untrained subjects.',
    plainSummary:
      'When weekly volume is equated, higher training frequency did not clearly add hypertrophy — total weekly sets is the primary driver, and frequency is mostly a tool to distribute that volume.',
    caveats:
      'Volume-equated designs; findings differ when frequency is used to add volume. Many included subjects were untrained.',
    evidenceScore: 'meta-analysis',
    trainingStatus: 'mixed',
  },
  {
    id: 'st-2',
    title: 'Lengthened partial reps vs. full ROM for muscle growth',
    journal: 'European Journal of Applied Physiology',
    year: 2023,
    topicTags: ['hypertrophy', 'technique'],
    studyDesign: 'rct',
    sampleNotes: 'n≈30 resistance-trained young adults, ~8-week intervention.',
    plainSummary:
      'Partial reps performed in the lengthened (stretched) portion of the range produced hypertrophy comparable to or exceeding full-ROM training in several muscles.',
    caveats:
      'Small sample, short duration, site-specific MRI/ultrasound outcomes. Not all muscles respond identically.',
    evidenceScore: 'rct',
    trainingStatus: 'trained',
  },
  {
    id: 'st-3',
    title: 'Training to failure vs. stopping short: strength and hypertrophy outcomes',
    journal: 'Journal of Strength and Conditioning Research',
    year: 2021,
    topicTags: ['hypertrophy', 'strength', 'programming'],
    studyDesign: 'meta-analysis',
    sampleNotes: 'Pooled RCTs; trained and untrained.',
    plainSummary:
      'Training closer to failure offered little extra hypertrophy once volume was equated, while adding fatigue. Strength gains slightly favored stopping shy of failure in some analyses.',
    caveats:
      'Failure is defined inconsistently across studies; RIR self-reports are noisy. A genuinely contested area.',
    evidenceScore: 'meta-analysis',
    trainingStatus: 'mixed',
  },
  {
    id: 'st-4',
    title: 'Higher protein intake and resistance-training adaptations',
    journal: 'British Journal of Sports Medicine',
    year: 2018,
    topicTags: ['nutrition', 'hypertrophy'],
    studyDesign: 'meta-analysis',
    sampleNotes: 'Large pooled sample across many RCTs.',
    plainSummary:
      'Protein supplementation enhanced gains in strength and lean mass up to roughly 1.6 g/kg/day, above which extra intake added little.',
    caveats:
      'Whole-diet protein matters more than supplement timing; individual variation exists.',
    evidenceScore: 'meta-analysis',
    trainingStatus: 'mixed',
  },
  {
    id: 'st-5',
    title: 'Fasted vs. fed resistance training and body composition',
    journal: 'Medicine & Science in Sports & Exercise',
    year: 2020,
    topicTags: ['nutrition', 'recovery'],
    studyDesign: 'rct',
    sampleNotes: 'n≈20 recreationally active adults.',
    plainSummary:
      'Training fasted vs. fed produced no meaningful difference in strength or muscle outcomes over the study period when total daily intake matched.',
    caveats:
      'Short duration, small n, recreational subjects. Performance on longer/harder sessions may still benefit from pre-training food.',
    evidenceScore: 'rct',
    trainingStatus: 'untrained',
  },
  {
    id: 'st-6',
    title: 'Heavy resistance training and patellar tendon adaptation',
    journal: 'European Journal of Applied Physiology',
    year: 2015,
    topicTags: ['tendon', 'recovery'],
    studyDesign: 'cohort',
    sampleNotes: 'Small cohort; imaging-based tendon stiffness measures.',
    plainSummary:
      'Tendon stiffness and cross-sectional area increased with high-load training but on a slower timeline than muscle strength gains.',
    caveats:
      'Observational design, small n; can’t isolate load from other training variables.',
    evidenceScore: 'observational',
    trainingStatus: 'mixed',
  },
  {
    id: 'st-7',
    title: 'Static stretching within training and hypertrophy',
    journal: 'Journal of Strength and Conditioning Research',
    year: 2022,
    topicTags: ['hypertrophy', 'recovery'],
    studyDesign: 'systematic-review',
    sampleNotes: 'Review of loaded-stretch and inter-set stretching protocols.',
    plainSummary:
      'Loaded stretching may add a small hypertrophy stimulus, but evidence in humans is preliminary and effect sizes are modest.',
    caveats:
      'Heterogeneous protocols, mostly short studies, several animal models. Genuinely unsettled.',
    evidenceScore: 'observational',
    trainingStatus: 'mixed',
  },
]

// Contested topics get an explicit "for / against" so we don't overclaim.
export interface Debate {
  id: string
  topic: string
  forClaim: string
  againstClaim: string
  bottomLine: string
  studyIds: string[]
}

export const DEBATES: Debate[] = [
  {
    id: 'dbt-failure',
    topic: 'Training to failure',
    forClaim:
      'Failure maximizes motor-unit recruitment and removes ambiguity about effort — useful on isolation work and for less-experienced lifters who under-rate effort.',
    againstClaim:
      'Volume-equated data show little added hypertrophy from failure while fatigue and injury/recovery cost climb, especially on heavy compounds.',
    bottomLine:
      'Reserve failure for isolation/machine work; keep 1–3 RIR on the big barbell lifts.',
    studyIds: ['st-3'],
  },
  {
    id: 'dbt-fasted',
    topic: 'Fasted training',
    forClaim:
      'Convenient, may suit morning trainees; no clear performance penalty on short sessions when daily nutrition is adequate.',
    againstClaim:
      'Pre-training carbs/protein can help harder or longer sessions; fasted status is unlikely to help body composition on its own.',
    bottomLine:
      'A preference call, not a performance lever — total daily intake dominates.',
    studyIds: ['st-5'],
  },
  {
    id: 'dbt-stretch',
    topic: 'Stretching for hypertrophy',
    forClaim:
      'Loaded/lengthened stretching shows promising hypertrophy signals and complements lengthened-ROM training.',
    againstClaim:
      'Human evidence is thin and short-term; effects are small and protocols vary wildly.',
    bottomLine:
      'Prioritize full-ROM lifting in the lengthened position; treat loaded stretching as experimental.',
    studyIds: ['st-7', 'st-2'],
  },
]
