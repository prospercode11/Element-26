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
  UserRound,
} from 'lucide-react'
import { LogoBadge } from './components/ui'
import DeviceChrome from './components/DeviceChrome'
import ProfileSheet from './components/ProfileSheet'
import Tour from './components/Tour'
import Quiz from './components/Quiz'
import { useAuth } from './data/auth'
import { StoreProvider, useStore } from './data/store'
import AuthScreen from './screens/AuthScreen'
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

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('e26-theme') as Theme) || 'dark',
  )
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('e26-theme', theme)
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

// ---- Auth gate -------------------------------------------------------------

export default function App() {
  const { currentUser, isGuest, ready } = useAuth()

  if (!ready) {
    return <DeviceChrome><div className="screen" /></DeviceChrome>
  }

  if (!currentUser) {
    return (
      <DeviceChrome
        caption={
          <>Interactive prototype — sign in or explore as a guest. © 2026 Element 26.</>
        }
      >
        <div className="screen">
          <AuthScreen />
        </div>
      </DeviceChrome>
    )
  }

  return (
    <StoreProvider account={currentUser} isGuest={isGuest}>
      <AppShell />
    </StoreProvider>
  )
}

// ---- Signed-in app ---------------------------------------------------------

function AppShell() {
  const { state } = useStore()
  // Onboarding is per-account, so every new sign-up starts with the tour → quiz
  // (rather than sharing one global "seen it" flag across users on the device).
  const uid = state.user.id
  const tourKey = `e26-tour-done-${uid}`
  const quizKey = `e26-quiz-done-${uid}`

  const [tab, setTab] = useState<Tab>('today')
  const [showPaywall, setShowPaywall] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [theme, toggleTheme] = useTheme()
  // First-launch flow: tour → quiz. Both replayable/skippable, both persisted.
  const [tourOpen, setTourOpen] = useState(() => !localStorage.getItem(tourKey))
  const [quizOpen, setQuizOpen] = useState(
    () => !!localStorage.getItem(tourKey) && !localStorage.getItem(quizKey),
  )

  function openBuild() {
    setShowPaywall(false)
    setTab('build')
  }

  function closeTour() {
    localStorage.setItem(tourKey, '1')
    setTourOpen(false)
    if (!localStorage.getItem(quizKey)) setQuizOpen(true)
  }

  function closeQuiz() {
    localStorage.setItem(quizKey, '1')
    setQuizOpen(false)
  }

  return (
    <DeviceChrome
      caption={
        <>
          Interactive prototype — log a session, import a program from a spreadsheet paste, and
          watch training maxes auto-progress. © 2026 Element 26.
        </>
      }
    >
      <div className="appbar">
        <LogoBadge />
        <h1 style={{ whiteSpace: 'nowrap' }}>Element 26</h1>
        <div className="spacer" />
        <button className="icon-btn" onClick={() => setTourOpen(true)} aria-label="replay the app tour">
          <HelpCircle size={16} />
        </button>
        <button
          className="icon-btn"
          onClick={toggleTheme}
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
        <button className="icon-btn" onClick={() => setShowProfile(true)} aria-label="account and sign out">
          <UserRound size={16} />
        </button>
      </div>

      <div className="screen">
        {showPaywall ? (
          <PaywallScreen onClose={() => setShowPaywall(false)} />
        ) : (
          <div key={tab} style={{ display: 'contents' }}>
            {tab === 'today' && <TodayScreen tourActive={tourOpen || quizOpen} openBuild={openBuild} />}
            {tab === 'build' && (
              <BuildScreen
                openPaywall={() => setShowPaywall(true)}
                openQuiz={() => setQuizOpen(true)}
              />
            )}
            {tab === 'science' && <ScienceScreen />}
            {tab === 'research' && <ResearchScreen openPaywall={() => setShowPaywall(true)} />}
            {tab === 'progress' && <ProgressScreen openBuild={openBuild} />}
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
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}

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
    </DeviceChrome>
  )
}
