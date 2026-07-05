import { useState } from 'react'
import { Activity, Check, CircleCheck, FileSpreadsheet, Search } from 'lucide-react'
import { Banner, Card } from '../components/ui'
import { useStore } from '../data/store'

export default function PaywallScreen({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [plan, setPlan] = useState<'lifetime' | 'annual'>('lifetime')

  if (state.user.isPro) {
    return (
      <div className="screen-pad">
        <h2 className="section">You’re on Pro</h2>
        <Banner kind="good" icon={<CircleCheck size={16} />}>
          Spreadsheet import, the full research database, and the auto-regulation engine are
          unlocked.
        </Banner>
        <button className="btn primary full mt12" onClick={onClose}>Back to the app</button>
      </div>
    )
  }

  return (
    <div className="screen-pad">
      <h2 className="section">Element 26 Pro</h2>
      <p className="lead">
        Pay once, own it. Built for lifters tired of renting their training log on a subscription.
      </p>

      {/* Lifetime is the headline offer. */}
      <div
        className={`card price-card ${plan === 'lifetime' ? 'selected' : ''}`}
        onClick={() => setPlan('lifetime')}
        role="radio"
        aria-checked={plan === 'lifetime'}
      >
        <span className="plan-radio">{plan === 'lifetime' && <Check size={13} strokeWidth={3} />}</span>
        <div className="save-flag">Pay once</div>
        <div className="price-big"><span className="cur">$</span>79.99</div>
        <div className="muted small" style={{ marginTop: 4 }}>Lifetime — one payment, every future update</div>
        <div className="tiny faint" style={{ marginTop: 8, lineHeight: 1.5 }}>
          Between Hevy’s $74.99 and Liftosaur’s $99.99 lifetime tiers.
        </div>
      </div>

      <div
        className={`card price-card ${plan === 'annual' ? 'selected' : ''}`}
        onClick={() => setPlan('annual')}
        role="radio"
        aria-checked={plan === 'annual'}
      >
        <span className="plan-radio">{plan === 'annual' && <Check size={13} strokeWidth={3} />}</span>
        <div className="price-big"><span className="cur">$</span>29.99<span className="per">/yr</span></div>
        <div className="muted small" style={{ marginTop: 4 }}>Annual</div>
      </div>

      <Card title="What Pro unlocks">
        <div className="kv">
          <span className="k row" style={{ gap: 9 }}>
            <FileSpreadsheet size={16} style={{ color: 'var(--ember-hi)' }} />
            <span style={{ color: 'var(--text)', fontWeight: 550 }}>Spreadsheet & screenshot import</span>
          </span>
        </div>
        <div className="kv">
          <span className="k row" style={{ gap: 9 }}>
            <Search size={16} style={{ color: 'var(--ember-hi)' }} />
            <span style={{ color: 'var(--text)', fontWeight: 550 }}>Full research database & study search</span>
          </span>
        </div>
        <div className="kv">
          <span className="k row" style={{ gap: 9 }}>
            <Activity size={16} style={{ color: 'var(--ember-hi)' }} />
            <span style={{ color: 'var(--text)', fontWeight: 550 }}>Auto-regulation & fatigue-based deloads</span>
          </span>
        </div>
      </Card>

      <Banner kind="info" icon={<CircleCheck size={16} />}>
        <b>Free forever:</b> full workout logging plus one imported or custom program. Pro adds
        the science engine on top.
      </Banner>

      <button className="btn primary full" onClick={() => dispatch({ type: 'upgradePro' })}>
        {plan === 'lifetime' ? 'Get lifetime — $79.99' : 'Start annual — $29.99/yr'}
      </button>
      <button className="btn ghost full mt8" onClick={onClose}>Maybe later</button>
    </div>
  )
}
