# Global Public Health Tracker

Real-time disease surveillance dashboard powered by **disease.sh API** + **Claude AI**, built with **React + Vite** (frontend) and **FastAPI** (backend).

---

## Project Structure

```
health-tracker/
├── backend/
│   ├── main.py            ← FastAPI app (API proxy + Claude AI)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx          ← Main dashboard layout & tabs
        ├── api.js           ← Axios service layer → FastAPI
        ├── utils.js         ← Number formatters
        ├── index.css        ← Global styles & CSS variables
        └── components/
            ├── MetricCard.jsx       ← Stat cards (cases, deaths…)
            ├── TopCountriesChart.jsx← Horizontal bar chart (Chart.js)
            ├── ContinentChart.jsx   ← Bar + Donut chart (Chart.js)
            ├── CountriesList.jsx    ← Sortable leaderboard
            ├── CountryDetail.jsx    ← Per-country deep dive + history
            └── AIAnalyst.jsx        ← Claude AI Q&A panel
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Add your Anthropic API key
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# Start backend (auto-reload)
uvicorn main:app --reload --port 8000
```

Backend runs at → http://localhost:8000  
Interactive API docs → http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → http://localhost:5173

Vite proxies all `/api` requests to `http://localhost:8000` automatically.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/global` | Global COVID-19 aggregate stats |
| GET | `/api/continents` | Stats by continent |
| GET | `/api/countries?sort=cases` | All countries (sortable) |
| GET | `/api/country/{name}` | Single country detail |
| GET | `/api/historical/{name}?days=30` | Timeline data |
| GET | `/api/vaccines` | Global vaccine coverage |
| GET | `/api/vaccines/{country}` | Country vaccine data |
| POST | `/api/ai/analyze` | Claude AI health analysis |
| GET | `/api/health` | Backend health check |

---

## Features

- **6 metric cards** — Cases, Deaths, Recovered, Active, Tests, Affected Countries
- **Top 10 chart** — Horizontal bar chart with cases + deaths
- **Continent charts** — Bar chart + Donut chart with toggle
- **Sortable leaderboard** — Sort by cases / deaths / recovered / active
- **Country lookup** — Search any country for full stats + 30-day trend
- **AI Analyst** — Ask Claude questions powered by live data context
- **Dark mode** — Automatic via `prefers-color-scheme`
- **Caching** — 5-minute in-memory cache on all API routes
- **CORS configured** — Ready for local development

---

## Environment Variables

**Backend** (`backend/.env`):
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Chart.js, Axios |
| Backend | FastAPI, Uvicorn, HTTPX |
| AI | Anthropic Claude Opus (via API) |
| Data | disease.sh (free, no key needed) |
| Styling | CSS Variables, Google Fonts (Syne + DM Mono) |

---

## Build for Production

```bash
# Frontend
cd frontend && npm run build   # outputs to frontend/dist/

# Backend — serve with gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
