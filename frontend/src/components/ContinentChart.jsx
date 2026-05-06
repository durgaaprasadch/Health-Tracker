import React, { useRef, useEffect } from 'react'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, DoughnutController, ArcElement } from 'chart.js'
import { fmt } from '../utils.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, DoughnutController, ArcElement)

const COLORS_CASES  = ['#378ADD','#639922','#EF9F27','#E24B4A','#7F77DD','#1D9E75','#D85A30']
const COLORS_DEATHS = ['#85B7EB','#97C459','#FAC775','#F09595','#AFA9EC','#5DCAA5','#F0997B']

export default function ContinentChart({ continents, type = 'bar' }) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!continents?.length || !ref.current) return
    if (chartRef.current) chartRef.current.destroy()

    const isDark = matchMedia('(prefers-color-scheme: dark)').matches
    const textColor = isDark ? '#b0afa8' : '#5a5955'
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    const sorted = [...continents].sort((a, b) => b.cases - a.cases)

    if (type === 'doughnut') {
      chartRef.current = new Chart(ref.current, {
        type: 'doughnut',
        data: {
          labels: sorted.map(c => c.continent),
          datasets: [{
            data: sorted.map(c => c.cases),
            backgroundColor: COLORS_CASES,
            borderColor: isDark ? '#1d1d1b' : '#f4f3f0',
            borderWidth: 2,
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)} cases` } },
          },
        },
      })
    } else {
      chartRef.current = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels: sorted.map(c => c.continent),
          datasets: [
            {
              label: 'Cases',
              data: sorted.map(c => c.cases),
              backgroundColor: COLORS_CASES,
              borderRadius: 4,
              borderSkipped: false,
            },
            {
              label: 'Deaths',
              data: sorted.map(c => c.deaths),
              backgroundColor: COLORS_DEATHS,
              borderRadius: 4,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` } },
          },
          scales: {
            x: { ticks: { color: textColor, font: { size: 10, family: 'DM Mono' } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { size: 10, family: 'DM Mono' }, callback: v => fmt(v) }, grid: { color: gridColor } },
          },
        },
      })
    }
    return () => chartRef.current?.destroy()
  }, [continents, type])

  return (
    <div style={{ position: 'relative', width: '100%', height: type === 'doughnut' ? 220 : 200 }}>
      <canvas ref={ref} role="img" aria-label="COVID-19 statistics by continent">
        Continent chart loading...
      </canvas>
    </div>
  )
}
