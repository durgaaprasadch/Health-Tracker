import React from 'react'

const VARIANTS = {
  danger: { bg: 'var(--red-bg)',   color: 'var(--red-text)' },
  warn:   { bg: 'var(--amber-bg)', color: 'var(--amber-text)' },
  ok:     { bg: 'var(--green-bg)', color: 'var(--green-text)' },
  info:   { bg: 'var(--blue-bg)',  color: 'var(--blue-text)' },
  neutral:{ bg: 'var(--surface-2)',color: 'var(--text-primary)' },
}

export default function MetricCard({ label, value, sub, variant = 'neutral', delay = 0 }) {
  const v = VARIANTS[variant] || VARIANTS.neutral

  return (
    <div
      className="fade-up"
      style={{
        animationDelay: `${delay}ms`,
        background: v.bg,
        borderRadius: 'var(--r-lg)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <span style={{
        fontFamily: 'var(--font-data)',
        fontSize: 10,
        letterSpacing: '0.7px',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-data)',
        fontSize: 26,
        fontWeight: 500,
        color: v.color,
        lineHeight: 1,
        wordBreak: 'break-all',
      }}>
        {value ?? <Skeleton width={80} />}
      </span>
      {sub && (
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: 11,
          color: 'var(--text-tertiary)',
        }}>
          {sub}
        </span>
      )}
    </div>
  )
}

export function Skeleton({ width = '100%', height = 14 }) {
  return (
    <span style={{
      display: 'inline-block',
      width,
      height,
      borderRadius: 4,
      background: 'var(--surface-3)',
      animation: 'shimmer 1.4s ease-in-out infinite',
    }} />
  )
}
