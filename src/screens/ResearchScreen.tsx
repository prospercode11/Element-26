import { useMemo, useState } from 'react'
import {
  Bookmark,
  BookmarkCheck,
  Compass,
  Info,
  Lock,
  Newspaper,
  Scale,
  Search,
} from 'lucide-react'
import { Banner, Card, EvidenceBadge } from '../components/ui'
import { useStore } from '../data/store'
import { DEBATES, STUDIES } from '../data/mock'
import type { StudyDesign, StudySummary, Topic } from '../data/types'

type Sub = 'feed' | 'search' | 'debates'

const TOPICS: Topic[] = ['hypertrophy', 'strength', 'recovery', 'nutrition', 'tendon', 'technique', 'programming']

export default function ResearchScreen({ openPaywall }: { openPaywall: () => void }) {
  const [sub, setSub] = useState<Sub>('feed')
  return (
    <div className="screen-pad">
      <h2 className="section">News & Research</h2>
      <p className="lead">Recent studies as plain-language cards — with the caveats that matter.</p>
      <div className="row wrap" style={{ marginBottom: 16 }}>
        <button className={`chip tap ${sub === 'feed' ? 'active' : ''}`} onClick={() => setSub('feed')}>
          <Newspaper size={14} /> Feed
        </button>
        <button className={`chip tap ${sub === 'search' ? 'active' : ''}`} onClick={() => setSub('search')}>
          <Search size={14} /> Study search
        </button>
        <button className={`chip tap ${sub === 'debates' ? 'active' : ''}`} onClick={() => setSub('debates')}>
          <Scale size={14} /> For / against
        </button>
      </div>
      {sub === 'feed' && <Feed />}
      {sub === 'search' && <StudySearch openPaywall={openPaywall} />}
      {sub === 'debates' && <Debates />}
    </div>
  )
}

function StudyCard({ study }: { study: StudySummary }) {
  const { state, dispatch } = useStore()
  const bookmarked = state.bookmarks.some((b) => b.studyId === study.id)
  return (
    <Card>
      <div className="row spread" style={{ marginBottom: 10, alignItems: 'flex-start' }}>
        <div className="row wrap" style={{ gap: 8 }}>
          {study.topicTags.map((t) => (
            <span key={t} className="tag-topic">{t}</span>
          ))}
        </div>
        <EvidenceBadge score={study.evidenceScore} />
      </div>
      <div style={{ fontWeight: 650, fontSize: 15.5, lineHeight: 1.4, fontFamily: 'var(--font-display)' }}>
        {study.title}
      </div>
      <div className="tiny faint" style={{ margin: '5px 0 12px' }}>
        {study.journal} · {study.year} · {study.studyDesign}
      </div>
      <div className="small muted" style={{ lineHeight: 1.6 }}>{study.plainSummary}</div>
      <div className="divider" />
      <div className="tiny" style={{ lineHeight: 1.55 }}>
        <b className="muted">Subjects:</b> <span className="faint">{study.sampleNotes}</span>
      </div>
      <div className="tiny mt8" style={{ lineHeight: 1.55 }}>
        <b style={{ color: 'var(--warn)' }}>Caveats:</b> <span className="faint">{study.caveats}</span>
      </div>
      <div className="row spread mt12">
        <span className="chip">{study.trainingStatus} lifters</span>
        <button
          className={`btn sm ${bookmarked ? 'primary' : ''}`}
          onClick={() => dispatch({ type: 'toggleBookmark', studyId: study.id })}
        >
          {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          {bookmarked ? 'Saved' : 'Save'}
        </button>
      </div>
    </Card>
  )
}

function Feed() {
  const [topic, setTopic] = useState<Topic | 'all'>('all')
  const list = STUDIES.filter((s) => topic === 'all' || s.topicTags.includes(topic))
    .sort((a, b) => b.year - a.year)
  return (
    <>
      <div className="row wrap" style={{ marginBottom: 14 }}>
        <button className={`chip tap ${topic === 'all' ? 'active' : ''}`} onClick={() => setTopic('all')}>All</button>
        {TOPICS.map((t) => (
          <button key={t} className={`chip tap ${topic === t ? 'active' : ''}`} onClick={() => setTopic(t)}>{t}</button>
        ))}
      </div>
      {list.map((s) => <StudyCard key={s.id} study={s} />)}
    </>
  )
}

function StudySearch({ openPaywall }: { openPaywall: () => void }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState<Topic | 'all'>('all')
  const [design, setDesign] = useState<StudyDesign | 'all'>('all')
  const [savedOnly, setSavedOnly] = useState(false)

  const results = useMemo(() => {
    return STUDIES.filter((s) => {
      if (savedOnly && !state.bookmarks.some((b) => b.studyId === s.id)) return false
      if (topic !== 'all' && !s.topicTags.includes(topic)) return false
      if (design !== 'all' && s.studyDesign !== design) return false
      if (q.trim()) {
        const hay = (s.title + s.plainSummary + s.journal + s.sampleNotes).toLowerCase()
        if (!hay.includes(q.toLowerCase().trim())) return false
      }
      return true
    })
  }, [q, topic, design, savedOnly, state.bookmarks])

  if (!state.user.isPro) {
    return (
      <div className="locked" style={{ minHeight: 260 }}>
        <div className="field">
          <input type="text" placeholder="Search studies…" disabled />
        </div>
        <Card>
          <div style={{ height: 120 }} />
        </Card>
        <div className="locked-veil">
          <span className="lock-ico"><Lock size={26} /></span>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>The study database is a Pro feature</div>
          <div className="small faint" style={{ lineHeight: 1.55, maxWidth: 260 }}>
            Searchable, filterable index with saved searches, built on the PubMed API.
          </div>
          <button className="btn primary sm mt8" onClick={openPaywall}>See Pro pricing</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Banner kind="info" icon={<Info size={16} />}>
        The prototype searches a local index. Production integrates the <b>PubMed API</b> behind
        the same topic, design, and sample filters.
      </Banner>
      <div className="field">
        <input type="text" placeholder="Search title, journal, findings…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Topic</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value as any)}>
            <option value="all">All topics</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Design</label>
          <select value={design} onChange={(e) => setDesign(e.target.value as any)}>
            <option value="all">Any design</option>
            {(['meta-analysis', 'systematic-review', 'rct', 'crossover', 'cohort', 'observational'] as StudyDesign[]).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        className={`chip tap ${savedOnly ? 'active' : ''}`}
        style={{ marginBottom: 14 }}
        onClick={() => setSavedOnly(!savedOnly)}
      >
        <Bookmark size={13} />
        Saved only ({state.bookmarks.length})
      </button>
      <div className="tiny faint" style={{ marginBottom: 10 }}>
        {results.length} result{results.length === 1 ? '' : 's'}
      </div>
      {results.map((s) => <StudyCard key={s.id} study={s} />)}
      {results.length === 0 && <div className="faint small">No studies match those filters.</div>}
    </>
  )
}

function Debates() {
  return (
    <>
      <Banner kind="info" icon={<Scale size={16} />}>
        On genuinely contested topics we show both sides. Presenting unsettled science as settled
        is how you lose informed lifters.
      </Banner>
      {DEBATES.map((d) => (
        <Card key={d.id} title={d.topic}>
          <div className="row" style={{ gap: 8, alignItems: 'stretch' }}>
            <div className="debate-col for">
              <h4>For</h4>
              {d.forClaim}
            </div>
            <div className="debate-col against">
              <h4>Against</h4>
              {d.againstClaim}
            </div>
          </div>
          <div className="mt12" style={{ marginBottom: 0 }}>
            <Banner kind="accent" icon={<Compass size={15} />}>
              <b>Bottom line:</b> {d.bottomLine}
            </Banner>
          </div>
        </Card>
      ))}
    </>
  )
}
