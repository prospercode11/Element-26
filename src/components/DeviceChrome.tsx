import React from 'react'

// The phone-frame shell (notch + status bar) shared by the auth screen and the
// main app, so both render identically inside the device mock.
export default function DeviceChrome({
  children,
  caption,
}: {
  children: React.ReactNode
  caption?: React.ReactNode
}) {
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
        {children}
      </div>
      {caption && <div className="device-caption">{caption}</div>}
    </div>
  )
}
