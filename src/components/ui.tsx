import React from 'react'
import type { EvidenceScore } from '../data/types'

export function EvidenceBadge({ score }: { score: EvidenceScore }) {
  const label =
    score === 'meta-analysis' ? 'Meta-analysis' : score === 'rct' ? 'RCT' : 'Observational'
  return <span className={`ev ${score}`}>{label}</span>
}

export function Card({
  title,
  children,
  className = '',
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  )
}

// The Element 26 mark: a periodic-table cell for iron.
export function LogoBadge() {
  return (
    <div className="logo-badge" aria-label="Element 26 — iron">
      <span className="num">26</span>
      <span className="sym">Fe</span>
    </div>
  )
}

export function Banner({
  kind = 'info',
  icon,
  children,
}: {
  kind?: 'info' | 'warn' | 'accent' | 'good'
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={`banner ${kind}`}>
      {icon && <span className="b-ico">{icon}</span>}
      <div>{children}</div>
    </div>
  )
}
