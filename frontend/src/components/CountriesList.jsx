import React from 'react'
import { fmt } from '../utils.js'

export default function CountriesList({ countries, sortField = 'cases', onSortChange }) {
  if (!countries?.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ height: 20, borderRadius: 4, background: 'var(--surface-3)', animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    )
  }

  const top = countries.slice(0, 15)
  const max = top[0][sortField] || 1

  const SORT_OPTIONS = [
    { value: 'cases',     label: 'Cases' },
    { value: 'deaths',    label: 'Deaths' },
    { value: 'recovered', label: 'Recovered' },
    { value: 'active',    label: 'Active' },
  ]

  const COLOR_MAP = {
    cases:     '#378ADD',
    deaths:    '#E24B4A',
    recovered: '#639922',
    active:    '#EF9F27',
  }
  const barColor = COLOR_MAP[sortField] || '#378ADD'

  return (
    <div>
      {onSortChange && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => onSortChange(o.value)}
              style={{
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontFamily: 'var(--font-data)',
                cursor: 'pointer',
                border: `0.5px solid ${sortField === o.value ? barColor : 'var(--border-md)'}`,
                background: sortField === o.value ? barColor : 'transparent',
                color: sortField === o.value ? '#fff' : 'var(--text-secondary)',
                transition: 'all .15s',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
        {top.map((c, i) => {
          const val = c[sortField] ?? 0
          const pct = Math.max(2, Math.round((val / max) * 100))
          return (
            <div key={c.country} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-tertiary)', width: 16, textAlign: 'right' }}>
                {i + 1}
              </span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-secondary)', width: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={c.country}>
                {c.country}
              </span>
              <div style={{ flex: 1, height: 5, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width .5s ease' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-primary)', width: 52, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {fmt(val)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
