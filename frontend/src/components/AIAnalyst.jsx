import React, { useState } from 'react'
import { askAI } from '../api.js'

const QUICK = [
  'Summarize the current global COVID-19 situation',
  'Which regions show the highest risk right now?',
  'How does the case fatality rate compare across continents?',
  'What does recovery data tell us about health outcomes?',
  'Which countries have the highest cases per million population?',
]

export default function AIAnalyst({ globalStats, continentStats, topCountries }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokens, setTokens] = useState(null)

  const ask = async (q) => {
    const query = (q || question).trim()
    if (!query) return
    setLoading(true); setAnswer(''); setError(''); setTokens(null)
    try {
      const res = await askAI({ question: query, globalStats, continentStats, topCountries })
      setAnswer(res.answer)
      setTokens(res.usage)
    } catch (e) {
      if (e?.response?.status === 503) {
        setError('AI service not configured — set GOOGLE_API_KEY in the backend .env file.')
      } else {
        setError(e?.response?.data?.detail || 'Failed to get AI response. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border-md)', borderRadius: 'var(--r-lg)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-tertiary)' }}>
          AI Health Analyst
        </span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, background: 'var(--blue-bg)', color: 'var(--blue-text)', padding: '2px 8px', borderRadius: 20 }}>
          Gemini Flash
        </span>
        {tokens && (
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
            {tokens.model || 'Gemini'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {QUICK.map(q => (
          <button
            key={q}
            onClick={() => { setQuestion(q); ask(q) }}
            disabled={loading}
            style={{
              padding: '4px 11px',
              borderRadius: 20,
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              border: '0.5px solid var(--border-md)',
              background: 'var(--surface-2)',
              color: 'var(--text-secondary)',
              transition: 'all .15s',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {q.length > 36 ? q.slice(0, 35) + '…' : q}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          disabled={loading}
          placeholder="Ask about disease trends, outbreaks, mortality rates..."
          style={{
            flex: 1, padding: '9px 13px', borderRadius: 'var(--r-md)',
            border: '0.5px solid var(--border-md)', background: 'var(--surface-2)',
            color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-display)',
            outline: 'none',
          }}
        />
        <button
          onClick={() => ask()}
          disabled={loading || !question.trim()}
          style={{
            padding: '9px 20px', borderRadius: 'var(--r-md)',
            border: '0.5px solid var(--border-md)',
            background: loading ? 'var(--surface-2)' : 'var(--text-primary)',
            color: loading ? 'var(--text-tertiary)' : 'var(--bg)',
            fontSize: 13, cursor: loading ? 'default' : 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 500,
            transition: 'all .15s', whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Thinking…' : 'Ask AI ↗'}
        </button>
      </div>

      <div style={{
        minHeight: 56,
        padding: answer || error || loading ? '12px 14px' : 0,
        background: answer || error || loading ? 'var(--surface-2)' : 'transparent',
        borderRadius: 'var(--r-md)',
        transition: 'all .2s',
      }}>
        {loading && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--text-tertiary)',
                animation: 'blink 1.1s ease infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        )}
        {error && !loading && (
          <p style={{ fontSize: 12, color: 'var(--red-text)', fontFamily: 'var(--font-data)', margin: 0 }}>{error}</p>
        )}
        {answer && !loading && (
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
            {answer}
          </p>
        )}
        {!loading && !error && !answer && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)', margin: 0 }}>
            Select a quick question or type your own above.
          </p>
        )}
      </div>
    </div>
  )
}
