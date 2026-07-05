import { useEffect, useState } from 'react'
import {
  Blocks,
  Check,
  Dumbbell,
  FlaskConical,
  HelpCircle,
  Moon,
  Newspaper,
  Sun,
  TrendingUp,
} from 'lucide-react'
import { LogoBadge } from './components/ui'
import Tour from './components/Tour'
import Quiz from './components/Quiz'
import { useStore } from './data/store'
import TodayScreen from './screens/TodayScreen'
import BuildScreen from './screens/BuildScreen'
import ScienceScreen from './screens/ScienceScreen'
import ResearchScreen from './screens/ResearchScreen'
import ProgressScreen from './screens/ProgressScreen'
import PaywallScreen from './screens/PaywallScreen'

type Tab = 'today' | 'build' | 'science' | 'research' | 'progress'

const TABS: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: 'today', label: 'Today', icon: Dumbbell },
  { id: 'build', label: 'Build', icon: Blocks },
  { id: 'science', label: 'Science', icon: FlaskConical },
  { id: 'research', label: 'Research', icon: Newspaper },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
]

type Theme = 'dark' | 'light'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [showPaywall, setShowPaywall] = useState(false)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('e26-theme') as Theme) || 'dark',
  )
  // First-launch flow: tour → quiz. Both replayable/skippable, both persisted.
  const [tourOpen, setTourOpen] = useState(() => !localStorage.getItem('e26-tour-done'))
  const [quizOpen, setQuizOpen] = useState(
    () => !!localStorage.getItem('e26-tour-done') && !localStorage.getItem('e26-quiz-done'),
  )
  const { state } = useStore()

  function closeTour() {
    localStorage.setItem('e26-tour-done', '1')
    setTourOpen(false)
    if (!localStorage.getItem('e26-quiz-done')) setQuizOpen(true)
  }

  function closeQuiz() {
    localStorage.setItem('e26-quiz-done', '1')
    setQuizOpen(false)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('e26-theme', theme)
  }, [theme])

  return (
    <div className="device-wrap">
      <div className="device">
        <div className="notch" />
        <div className="statusbar">
          <span>9:41</span>
          <span className="glyphs">
            {/* signal */}
            <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
              <rect x="0" y="7" width="3" height="4" rx="1" />
              <rect x="4.5" y="5" width="3" height="6" rx="1" />
              <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
              <rect x="13.5" y="0" width="3" height="11" rx="1" opacity="0.35" />
            </svg>
            {/* battery */}
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden>
              <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.4" />
              <rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor" />
              <path d="M23 4v4c1-.3 1.7-1 1.7-2S24 4.3 23 4z" fill="currentColor" opacity="0.4" />
            </svg>
          </span>
        </div>

        <div className="appbar">
          <LogoBadge />
          <h1 style={{ whiteSpace: 'nowrap' }}>Element 26</h1>
          <div className="spacer" />
          <button className="icon-btn" onClick={() => setTourOpen(true)} aria-label="replay the app tour">
            <HelpCircle size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className={`chip tap ${state.user.isPro ? 'active' : ''}`}
            onClick={() => setShowPaywall(true)}
          >
            {state.user.isPro && <Check size={13} strokeWidth={2.5} />}
            {state.user.isPro ? 'Pro' : 'Upgrade'}
          </button>
        </div>

        <div className="screen">
          {showPaywall ? (
            <PaywallScreen onClose={() => setShowPaywall(false)} />
          ) : (
            <div key={tab} style={{ display: 'contents' }}>
              {tab === 'today' && <TodayScreen tourActive={tourOpen || quizOpen} />}
              {tab === 'build' && (
                <BuildScreen
                  openPaywall={() => setShowPaywall(true)}
                  openQuiz={() => setQuizOpen(true)}
                />
              )}
              {tab === 'science' && <ScienceScreen />}
              {tab === 'research' && <ResearchScreen openPaywall={() => setShowPaywall(true)} />}
              {tab === 'progress' && <ProgressScreen />}
            </div>
          )}
        </div>

        {tourOpen && <Tour onClose={closeTour} />}
        {quizOpen && !tourOpen && (
          <Quiz
            onClose={closeQuiz}
            onImport={() => {
              closeQuiz()
              setShowPaywall(false)
              setTab('build')
            }}
          />
        )}

        <div className="tabbar">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = !showPaywall && tab === t.id
            return (
              <button
                key={t.id}
                className={`tab ${active ? 'active' : ''}`}
                onClick={() => {
                  setShowPaywall(false)
                  setTab(t.id)
                }}
              >
                <Icon size={21} strokeWidth={active ? 2 : 1.75} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="device-caption">
        Interactive prototype — log a session, import a program from a spreadsheet paste, and
        watch training maxes auto-progress. © 2026 Element 26.
      </div>
    </div>
  )
}
