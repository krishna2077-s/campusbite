import React from 'react'

export default function LoadingSpinner({ text = 'Loading...', fullPage = false }) {
  if (fullPage) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '14px',
        background: 'var(--bg)',
      }}>
        <div className="spinner" />
        <p className="spinner-text">{text}</p>
      </div>
    )
  }

  return (
    <div className="spinner-overlay">
      <div className="spinner" />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  )
}

export function InlineSpinner() {
  return <span className="spinner spinner-sm" style={{ display: 'inline-block' }} />
}
