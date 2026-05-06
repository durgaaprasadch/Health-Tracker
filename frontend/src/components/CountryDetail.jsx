import React, { useState } from 'react'
import { fetchCountry, fetchHistorical } from '../api.js'
import { fmt, fmtFull, cfr, pct } from '../utils.js'
import { useRef, useEffect } from 'react'
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler)

function HistoryChart({ historical }) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!historical || !ref.current) return
    if (chartRef.current) chartRef.current.destroy()
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches
    const textColor = isDark ? '#b0afa8' : '#5a5955'
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    const tl = historical.timeline || {}
    const dates = Object.keys(tl.cases || {}).slice(-30)
    const casesData = dates.map(d => tl.cases?.[d] ?? 0)
    const deathsData = dates.map(d => tl.deaths?.[d] ?? 0)

    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: dates.map(d => d.slice(0, 5)),
        datasets: [
          {
            label: 'Cases',
            data: casesData,
            borderColor: '#378ADD',
            backgroundColor: 'rgba(55,138,221,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Deaths',
            data: deathsData,
            borderColor: '#E24B4A',
            backgroundColor: 'rgba(226,75,74,0.06)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtFull(ctx.raw)}` } },
        },
        scales: {
          x: { ticks: { color: textColor, font: { size: 9, family: 'DM Mono' }, maxTicksLimit: 8 }, grid: { display: false } },
          y: { ticks: { color: textColor, font: { size: 9, family: 'DM Mono' }, callback: v => fmt(v) }, grid: { color: gridColor } },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [historical])

  return (
    <div style={{ position: 'relative', width: '100%', height: 160 }}>
      <canvas ref={ref} role="img" aria-label="30-day historical COVID timeline">Historical chart</canvas>
    </div>
  )
}

export default function CountryDetail({ onClose }) {
  const [query, setQuery] = useState('')
  const [data, setData] = useState(null)
  const [historical, setHistorical] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true); setError(''); setData(null); setHistorical(null)
    try {
      const [country, hist] = await Promise.all([fetchCountry(q), fetchHistorical(q, 30)])
      setData(country)
      setHistorical(hist)
    } catch (e) {
      setError(e?.response?.data?.detail || `Country "${q}" not found.`)
    } finally {
      setLoading(false)
    }
  }

  const STATS = data ? [
    { label: 'Total Cases',   value: fmtFull(data.cases),     sub: `+${fmtFull(data.todayCases)} today`, variant: 'danger' },
    { label: 'Deaths',        value: fmtFull(data.deaths),    sub: `CFR ${cfr(data.deaths, data.cases)}`, variant: 'warn' },
    { label: 'Recovered',     value: fmtFull(data.recovered), sub: pct(data.recovered, data.cases) + ' of cases', variant: 'ok' },
    { label: 'Active',        value: fmtFull(data.active),    sub: `${fmtFull(data.critical)} critical`, variant: 'info' },
    { label: 'Tests',         value: fmt(data.tests),         sub: `${fmt(data.testsPerOneMillion)}/1M pop`, variant: 'neutral' },
    { label: 'Cases/1M',      value: fmt(data.casesPerOneMillion), sub: `Pop: ${fmt(data.population)}`, variant: 'neutral' },
  ] : []

  const VARIANT_COLORS = {
    danger: { bg: 'var(--red-bg)',   color: 'var(--red-text)' },
    warn:   { bg: 'var(--amber-bg)', color: 'var(--amber-text)' },
    ok:     { bg: 'var(--green-bg)', color: 'var(--green-text)' },
    info:   { bg: 'var(--blue-bg)',  color: 'var(--blue-text)' },
    neutral:{ bg: 'var(--surface-2)',color: 'var(--text-primary)' },
  }

  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border-md)', borderRadius: 'var(--r-lg)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-tertiary)' }}>
          Country Lookup
        </span>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-tertiary)', lineHeight: 1 }}>×</button>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Enter country name (e.g. India, Brazil)..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--r-md)', border: '0.5px solid var(--border-md)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-display)', outline: 'none' }}
        />
        <button
          onClick={search}
          disabled={loading}
          style={{ padding: '8px 18px', borderRadius: 'var(--r-md)', border: '0.5px solid var(--border-md)', background: 'var(--text-primary)', color: 'var(--bg)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 500, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {error && <div style={{ color: 'var(--red-text)', background: 'var(--red-bg)', padding: '8px 12px', borderRadius: 'var(--r-md)', fontSize: 12, fontFamily: 'var(--font-data)', marginBottom: 12 }}>{error}</div>}

      {data && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {data.countryInfo?.flag && <img src={data.countryInfo.flag} alt={data.country} style={{ width: 32, height: 22, objectFit: 'cover', borderRadius: 3, border: '0.5px solid var(--border)' }} />}
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{data.country}</span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-tertiary)' }}>· {data.continent}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 16 }}>
            {STATS.map(s => {
              const v = VARIANT_COLORS[s.variant]
              return (
                <div key={s.label} style={{ background: v.bg, borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 18, fontWeight: 500, color: v.color, lineHeight: 1 }}>{s.value}</div>
                  {s.sub && <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>{s.sub}</div>}
                </div>
              )
            })}
          </div>
          {historical && (
            <div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-tertiary)', marginBottom: 10 }}>30-Day Trend</div>
              <HistoryChart historical={historical} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
