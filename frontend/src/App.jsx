import React, { useState, useEffect, useCallback } from 'react'
import { fetchGlobal, fetchContinents, fetchCountries } from './api.js'
import { fmt, fmtFull, cfr, pct } from './utils.js'
import MetricCard from './components/MetricCard.jsx'
import TopCountriesChart from './components/TopCountriesChart.jsx'
import ContinentChart from './components/ContinentChart.jsx'
import CountriesList from './components/CountriesList.jsx'
import CountryDetail from './components/CountryDetail.jsx'
import AIAnalyst from './components/AIAnalyst.jsx'

/* ─── Card wrapper ─── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '16px 18px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-data)',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.7px',
      color: 'var(--text-tertiary)',
      marginBottom: 14,
    }}>
      {children}
    </div>
  )
}

/* ─── Main App ─── */
export default function App() {
  const [globalData, setGlobalData]     = useState(null)
  const [continents, setContinents]     = useState(null)
  const [countries, setCountries]       = useState(null)
  const [sortField, setSortField]       = useState('cases')
  const [tab, setTab]                   = useState('overview')
  const [chartType, setChartType]       = useState('bar')
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [lastUpdated, setLastUpdated]   = useState(null)

  const loadData = useCallback(async (sort = sortField) => {
    setLoading(true); setError('')
    try {
      const [g, c, co] = await Promise.all([
        fetchGlobal(),
        fetchContinents(),
        fetchCountries(sort),
      ])
      setGlobalData(g)
      setContinents(c)
      setCountries(co)
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Data load failed:', e)
      if (e.code === 'ECONNABORTED') {
        setError('Request timed out. The backend or public API is taking too long to respond.')
      } else if (!e.response) {
        setError('Cannot connect to backend. Is it running on port 8000?')
      } else {
        setError(`Failed to load data: ${e.response.data?.detail || e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }, [sortField])


  useEffect(() => { loadData() }, [])

  const handleSortChange = (field) => {
    setSortField(field)
    loadData(field)
  }

  const g = globalData

  const METRICS = g ? [
    { label: 'Total Cases',  value: fmt(g.cases),     sub: `+${fmt(g.todayCases)} today`,  variant: 'danger',  delay: 0   },
    { label: 'Deaths',       value: fmt(g.deaths),    sub: `CFR ${cfr(g.deaths, g.cases)}`,variant: 'warn',    delay: 50  },
    { label: 'Recovered',    value: fmt(g.recovered), sub: pct(g.recovered, g.cases) + ' of cases', variant: 'ok', delay: 100 },
    { label: 'Active Cases', value: fmt(g.active),    sub: `${fmt(g.critical)} critical`,  variant: 'info',    delay: 150 },
    { label: 'Total Tests',  value: fmt(g.tests),     sub: `${fmt(g.testsPerOneMillion)}/1M pop`, variant: 'neutral', delay: 200 },
    { label: 'Countries',    value: fmt(g.affectedCountries), sub: 'reporting data', variant: 'neutral', delay: 250 },
  ] : []

  const TABS = [
    { id: 'overview',  label: 'Overview'  },
    { id: 'countries', label: 'Countries' },
    { id: 'continents',label: 'Continents'},
    { id: 'lookup',    label: 'Country Lookup' },
    { id: 'ai',        label: 'AI Analyst' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Header ── */}
      <header style={{
        borderBottom: '0.5px solid var(--border)',
        background: 'var(--surface)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 9, height: 9 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)' }} />
              <div style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                border: '1.5px solid var(--green)',
                animation: 'pulse-ring 1.8s infinite',
              }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Global Health Tracker
            </span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-tertiary)', display: 'none', ['@media(min-width:600px)']: { display: 'inline' } }}>
              powered by disease.sh + Gemini AI
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastUpdated && (
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-tertiary)' }}>
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => loadData()}
              disabled={loading}
              style={{
                padding: '5px 12px', borderRadius: 'var(--r-md)',
                border: '0.5px solid var(--border-md)', background: 'var(--surface-2)',
                color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-display)', opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 16, fontFamily: 'var(--font-data)', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* ── Metrics Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          {loading && !g
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 80, borderRadius: 'var(--r-lg)', background: 'var(--surface-2)', animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 60}ms` }} />
              ))
            : METRICS.map(m => <MetricCard key={m.label} {...m} />)
          }
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap', borderBottom: '0.5px solid var(--border)', paddingBottom: 12 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--r-xl)',
                fontSize: 12, fontFamily: 'var(--font-display)',
                cursor: 'pointer', fontWeight: tab === t.id ? 600 : 400,
                border: tab === t.id ? '0.5px solid var(--text-primary)' : '0.5px solid var(--border)',
                background: tab === t.id ? 'var(--text-primary)' : 'transparent',
                color: tab === t.id ? 'var(--bg)' : 'var(--text-secondary)',
                transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Card style={{ gridColumn: '1 / -1' }}>
              <CardLabel>Top 10 Countries — Cases &amp; Deaths</CardLabel>
              <TopCountriesChart countries={countries} />
            </Card>
            <Card>
              <CardLabel>Continent Breakdown</CardLabel>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['bar', 'doughnut'].map(ct => (
                  <button key={ct} onClick={() => setChartType(ct)} style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                    fontFamily: 'var(--font-data)',
                    border: chartType === ct ? '0.5px solid var(--blue)' : '0.5px solid var(--border-md)',
                    background: chartType === ct ? 'var(--blue-bg)' : 'transparent',
                    color: chartType === ct ? 'var(--blue-text)' : 'var(--text-secondary)',
                  }}>{ct}</button>
                ))}
              </div>
              <ContinentChart continents={continents} type={chartType} />
            </Card>
            <Card>
              <CardLabel>Leaderboard</CardLabel>
              <CountriesList countries={countries} sortField={sortField} onSortChange={handleSortChange} />
            </Card>
          </div>
        )}

        {/* ── Countries Tab ── */}
        {tab === 'countries' && (
          <Card>
            <CardLabel>All Countries — Sorted by {sortField}</CardLabel>
            <CountriesList countries={countries} sortField={sortField} onSortChange={handleSortChange} />
          </Card>
        )}

        {/* ── Continents Tab ── */}
        {tab === 'continents' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <Card>
              <CardLabel>Continent Distribution — Bar Chart</CardLabel>
              <ContinentChart continents={continents} type="bar" />
            </Card>
            <Card>
              <CardLabel>Continent Distribution — Donut Chart</CardLabel>
              <ContinentChart continents={continents} type="doughnut" />
            </Card>
            {continents && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {[...continents].sort((a,b)=>b.cases-a.cases).map(c => (
                  <div key={c.continent} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 4 }}>{c.continent}</div>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(c.cases)}</div>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{fmt(c.deaths)} deaths · {fmt(c.recovered)} recovered</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Lookup Tab ── */}
        {tab === 'lookup' && <CountryDetail />}

        {/* ── AI Tab ── */}
        {tab === 'ai' && (
          <AIAnalyst
            globalStats={globalData}
            continentStats={continents}
            topCountries={countries?.slice(0, 10)}
          />
        )}
      </main>
    </div>
  )
}
