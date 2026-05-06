import axios from 'axios'

// Use the Vercel environment variable, or fallback to empty string for local proxy
const baseURL = import.meta.env.VITE_API_URL || ''
const api = axios.create({ baseURL, timeout: 15000 })

export const fetchGlobal       = ()        => api.get('/api/global').then(r => r.data)
export const fetchContinents   = ()        => api.get('/api/continents').then(r => r.data)
export const fetchCountries    = (sort='cases') => api.get('/api/countries', { params: { sort } }).then(r => r.data)
export const fetchCountry      = (name)    => api.get(`/api/country/${encodeURIComponent(name)}`).then(r => r.data)
export const fetchHistorical   = (name, days=30) => api.get(`/api/historical/${encodeURIComponent(name)}`, { params: { days } }).then(r => r.data)
export const fetchVaccineGlobal  = ()      => api.get('/api/vaccines').then(r => r.data)
export const fetchVaccineCountry = (name)  => api.get(`/api/vaccines/${encodeURIComponent(name)}`).then(r => r.data)

export const askAI = ({ question, globalStats, continentStats, topCountries }) =>
  api.post('/api/ai/analyze', {
    question,
    global_stats:    globalStats   || null,
    continent_stats: continentStats || null,
    top_countries:   topCountries  || null,
  }).then(r => r.data)
