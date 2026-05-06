import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'
const api = axios.create({ baseURL, timeout: 15000 })

export const fetchGlobal       = ()        => api.get('/global').then(r => r.data)
export const fetchContinents   = ()        => api.get('/continents').then(r => r.data)
export const fetchCountries    = (sort='cases') => api.get('/countries', { params: { sort } }).then(r => r.data)
export const fetchCountry      = (name)    => api.get(`/country/${encodeURIComponent(name)}`).then(r => r.data)
export const fetchHistorical   = (name, days=30) => api.get(`/historical/${encodeURIComponent(name)}`, { params: { days } }).then(r => r.data)
export const fetchVaccineGlobal  = ()      => api.get('/vaccines').then(r => r.data)
export const fetchVaccineCountry = (name)  => api.get(`/vaccines/${encodeURIComponent(name)}`).then(r => r.data)

export const askAI = ({ question, globalStats, continentStats, topCountries }) =>
  api.post('/ai/analyze', {
    question,
    global_stats:    globalStats   || null,
    continent_stats: continentStats || null,
    top_countries:   topCountries  || null,
  }).then(r => r.data)
