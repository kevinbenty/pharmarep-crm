# PharmaRep CRM — HCP Interaction Manager

AI-first CRM for pharmaceutical field reps to log and manage HCP (Healthcare Professional) interactions.

**🌐 Live demo: [kevinbenty.github.io/pharmarep-crm](https://kevinbenty.github.io/pharmarep-crm/)**

> The live demo runs entirely in your browser with sample data and a simulated AI assistant, so no backend or API key is needed. The full app uses the FastAPI backend, PostgreSQL and the LangGraph agent described below.

## Tech Stack
- **Frontend**: React + Redux Toolkit + Vite
- **Backend**: Python + FastAPI
- **AI Agent**: LangGraph + Groq (gemma2-9b-it)
- **Database**: PostgreSQL (Neon)
- **Font**: Google Inter

## Features
- 📝 **Log Interaction** — Form mode with AI-generated summary & sentiment
- ✏️ **Edit Interaction** — Update any field of existing records
- 💬 **AI Chat Mode** — Natural language interface to log, edit, query interactions
- 📊 **Dashboard** — Stats: total interactions, sentiment breakdown, follow-ups
- 🔍 **Interaction History** — Browse, filter, and view all HCP records

## LangGraph Tools (5)
1. `log_interaction` — Save new HCP interaction with AI summary
2. `edit_interaction` — Update existing interaction record
3. `get_interaction_history` — Retrieve past interactions by HCP name
4. `schedule_follow_up` — Mark interaction for follow-up
5. `analyze_hcp_engagement` — AI-powered engagement analysis & recommendations

## Setup & Run

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## API Endpoints
- `GET /interactions` — List all interactions
- `POST /interactions` — Create new interaction
- `PUT /interactions/{id}` — Update interaction
- `DELETE /interactions/{id}` — Delete interaction
- `POST /chat` — AI chat endpoint (LangGraph agent)


## Demo mode
The frontend can run without the backend: build or start it with `VITE_DEMO_MODE=true` (for example `VITE_DEMO_MODE=true npm run dev` in `frontend/`). The GitHub Pages demo is built and deployed automatically by `.github/workflows/deploy-demo.yml` on every change to `frontend/`. To point the full app at a deployed backend, set `VITE_API_URL`.
