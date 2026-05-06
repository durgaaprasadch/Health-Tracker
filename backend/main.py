"""
Public Health Tracker — FastAPI Backend
Proxies disease.sh API + serves Claude AI insights
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from google import genai
import os
from functools import lru_cache
from typing import Optional
import time
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Public Health Tracker API",
    description="Real-time global disease surveillance powered by disease.sh and Claude AI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Public Health Tracker API is running",
        "docs": "/docs",
        "endpoints": {
            "global": "/api/global",
            "countries": "/api/countries",
            "health": "/api/health"
        }
    }

BASE_URL = "https://disease.sh/v3/covid-19"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Initialize Gemini Client
client = None
if GOOGLE_API_KEY:
    client = genai.Client(api_key=GOOGLE_API_KEY)

# Simple in-memory cache
_cache: dict[str, tuple[float, any]] = {}
CACHE_TTL = 300  # 5 minutes


def get_cached(key: str):
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
    return None


def set_cached(key: str, data):
    _cache[key] = (time.time(), data)


# ─── Disease.sh Proxy Routes ───────────────────────────────────────────────

@app.get("/api/global", tags=["COVID-19"])
async def get_global_stats():
    """Global COVID-19 aggregate statistics."""
    cached = get_cached("global")
    if cached:
        return cached
    async with httpx.AsyncClient(timeout=10) as client_http:
        r = await client_http.get(f"{BASE_URL}/all")
        r.raise_for_status()
        data = r.json()
    set_cached("global", data)
    return data


@app.get("/api/continents", tags=["COVID-19"])
async def get_continents():
    """COVID-19 stats broken down by continent."""
    cached = get_cached("continents")
    if cached:
        return cached
    async with httpx.AsyncClient(timeout=10) as client_http:
        r = await client_http.get(f"{BASE_URL}/continents")
        r.raise_for_status()
        data = r.json()
    set_cached("continents", data)
    return data


@app.get("/api/countries", tags=["COVID-19"])
async def get_countries(sort: str = Query("cases", enum=["cases", "deaths", "recovered", "active"])):
    """COVID-19 stats for all countries, sorted by a given field."""
    key = f"countries_{sort}"
    cached = get_cached(key)
    if cached:
        return cached
    async with httpx.AsyncClient(timeout=10) as client_http:
        r = await client_http.get(f"{BASE_URL}/countries", params={"sort": sort})
        r.raise_for_status()
        data = r.json()
    set_cached(key, data)
    return data


@app.get("/api/country/{name}", tags=["COVID-19"])
async def get_country(name: str):
    """COVID-19 detail for a specific country."""
    key = f"country_{name.lower()}"
    cached = get_cached(key)
    if cached:
        return cached
    async with httpx.AsyncClient(timeout=10) as client_http:
        r = await client_http.get(f"{BASE_URL}/countries/{name}")
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Country '{name}' not found.")
        r.raise_for_status()
        data = r.json()
    set_cached(key, data)
    return data


@app.get("/api/historical/{name}", tags=["Historical"])
async def get_historical(name: str, days: int = Query(30, ge=1, le=365)):
    """Historical COVID-19 timeline for a country (cases, deaths, recovered)."""
    async with httpx.AsyncClient(timeout=10) as client_http:
        r = await client_http.get(f"{BASE_URL}/historical/{name}", params={"lastdays": days})
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail=f"No historical data for '{name}'.")
        r.raise_for_status()
        return r.json()


@app.get("/api/vaccines", tags=["Vaccines"])
async def get_vaccine_global():
    """Global vaccine coverage data."""
    async with httpx.AsyncClient(timeout=10) as client_http:
        r = await client_http.get(f"{BASE_URL}/vaccine/coverage", params={"lastdays": 30})
        r.raise_for_status()
        return r.json()


@app.get("/api/vaccines/{country}", tags=["Vaccines"])
async def get_vaccine_country(country: str):
    """Vaccine coverage for a specific country."""
    async with httpx.AsyncClient(timeout=10) as client_http:
        r = await client_http.get(f"{BASE_URL}/vaccine/coverage/countries/{country}", params={"lastdays": 30})
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail=f"No vaccine data for '{country}'.")
        r.raise_for_status()
        return r.json()


# ─── AI Analyst Route ──────────────────────────────────────────────────────

class AIRequest(BaseModel):
    question: str
    global_stats: Optional[dict] = None
    continent_stats: Optional[list] = None
    top_countries: Optional[list] = None


@app.post("/api/ai/analyze", tags=["AI"])
async def ai_analyze(req: AIRequest):
    def fmt(n):
        if not n:
            return "N/A"
        n = int(n)
        if n >= 1_000_000:
            return f"{n/1_000_000:.2f}M"
        if n >= 1_000:
            return f"{n/1_000:.1f}K"
        return str(n)

    context_parts = []
    if req.global_stats:
        g = req.global_stats
        cfr = f"{(g.get('deaths',0)/g.get('cases',1)*100):.2f}%" if g.get("cases") else "N/A"
        context_parts.append(
            f"Global snapshot: {fmt(g.get('cases'))} total cases, "
            f"{fmt(g.get('deaths'))} deaths (CFR {cfr}), "
            f"{fmt(g.get('recovered'))} recovered, "
            f"{fmt(g.get('active'))} active, "
            f"{fmt(g.get('critical'))} critical. "
            f"Today: +{fmt(g.get('todayCases'))} cases, +{fmt(g.get('todayDeaths'))} deaths."
        )
    if req.top_countries:
        top5 = req.top_countries[:5]
        context_parts.append(
            "Top 5 countries by cases: " +
            ", ".join(f"{c.get('country')}: {fmt(c.get('cases'))}" for c in top5) + "."
        )
    if req.continent_stats:
        context_parts.append(
            "By continent: " +
            ", ".join(f"{c.get('continent')}: {fmt(c.get('cases'))} cases" for c in req.continent_stats) + "."
        )

    context = " ".join(context_parts)

    if not client:
        raise HTTPException(status_code=503, detail="Gemini client not initialized (check GOOGLE_API_KEY).")

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=f"{context}\n\nQuestion: {req.question}",
            config={
                "system_instruction": (
                    "You are a senior public health analyst. Answer questions using the real-time disease data "
                    "provided. Be concise (under 120 words), data-driven, and clear. Plain text only — no markdown, "
                    "no bullet symbols, no headers. Two short paragraphs max."
                ),
                "safety_settings": [
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                ]
            }
        )
        
        if not response.text:
            # Check if it was blocked
            if response.candidates and response.candidates[0].finish_reason == "SAFETY":
                return {"answer": "The AI response was filtered due to safety settings. Please try rephrasing.", "usage": {"model": "gemini-flash-latest"}}
            return {"answer": "No analysis available.", "usage": {"model": "gemini-flash-latest"}}
            
        return {"answer": response.text, "usage": {"model": "gemini-flash-latest"}}
    except Exception as e:
        print(f"DEBUG AI ERROR: {str(e)}") # Log to backend console
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


# ─── Health Check ──────────────────────────────────────────────────────────

@app.get("/api/health", tags=["System"])
async def health():
    return {"status": "ok", "ai_configured": client is not None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
