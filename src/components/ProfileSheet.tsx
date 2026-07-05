import { LogOut, ShieldCheck, UserRound, X } from 'lucide-react'
import { Banner } from './ui'
import { useAuth } from '../data/auth'
import { useStore } from '../data/store'

// Account sheet reached from the appbar avatar: shows who's signed in, lets
// them flip units, and signs out.
export default function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { currentUser, isGuest, signOut } = useAuth()
  const { state, dispatch } = useStore()

  return (
    <div className="overlay sheet-bottom" onClick={onClose} role="dialog" aria-label="Account">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sh-title">Account</span>
          <button className="icon-btn" onClick={onClose} aria-label="close">
            <X size={16} />
          </button>
        </div>

        <div className="profile-id">
          <div className="profile-avatar">
            <UserRound size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 650, fontSize: 16 }}>
              {isGuest ? 'Guest' : currentUser?.name || 'Lifter'}
            </div>
            <div className="tiny faint" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isGuest ? 'Not signed in — nothing is saved' : currentUser?.email}
            </div>
          </div>
          <div className="spacer" style={{ flex: 1 }} />
          <span className={`chip ${state.user.isPro ? 'active' : ''}`}>
            {state.user.isPro ? (
              <>
                <ShieldCheck size={13} /> Pro
              </>
            ) : (
              'Free'
            )}
          </span>
        </div>

        <div className="kv" style={{ marginTop: 6 }}>
          <span className="k">Units</span>
          <button
            className="btn sm"
            onClick={() => dispatch({ type: 'setUnits', units: state.user.units === 'lb' ? 'kg' : 'lb' })}
          >
            {state.user.units === 'lb' ? 'Pounds (lb)' : 'Kilograms (kg)'}
          </button>
        </div>

        {isGuest && (
          <Banner kind="info">
            You're browsing as a guest. Sign out to create an account and keep your programs and
            history saved.
          </Banner>
        )}

        <button className="btn full mt12" onClick={signOut}>
          <LogOut size={16} />
          {isGuest ? 'Exit guest & sign in' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
