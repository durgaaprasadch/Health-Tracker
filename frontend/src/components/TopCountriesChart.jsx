import React, { useRef, useEffect } from 'react'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'
import { fmt, trunc } from '../utils.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

export default function TopCountriesChart({ countries }) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!countries?.length || !ref.current) return
    if (chartRef.current) chartRef.current.destroy()

    const isDark = matchMedia('(prefers-color-scheme: dark)').matches
    const textColor = isDark ? '#b0afa8' : '#5a5955'
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    const top10 = countries.slice(0, 10)

    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: top10.map(c => trunc(c.country, 11)),
        datasets: [{
          label: 'Cases',
          data: top10.map(c => c.cases),
          backgroundColor: isDark ? '#185FA5' : '#85B7EB',
          borderColor: '#378ADD',
          borderWidth: 1,
          borderRadius: 4,
        }, {
          label: 'Deaths',
          data: top10.map(c => c.deaths),
          backgroundColor: isDark ? '#791F1F' : '#F09595',
          borderColor: '#E24B4A',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { size: 10, family: 'DM Mono' }, callback: v => fmt(v) },
            grid: { color: gridColor },
          },
          y: {
            ticks: { color: textColor, font: { size: 10, family: 'DM Mono' } },
            grid: { display: false },
          },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [countries])

  const isDark = matchMedia('(prefers-color-scheme: dark)').matches

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        {[{ color: '#378ADD', label: 'Cases' }, { color: '#E24B4A', label: 'Deaths' }].map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-data)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
            {l.label}
          </span>
        ))}
      </div>
      <div style={{ position: 'relative', width: '100%', height: 260 }}>
        <canvas ref={ref} role="img" aria-label="Top 10 countries by COVID-19 cases and deaths">
          Top 10 countries chart loading...
        </canvas>
      </div>
    </div>
  )
}
