# PharmaRep CRM — HCP Interaction Manager

AI-first CRM for pharmaceutical field reps to log and manage HCP (Healthcare Professional) interactions.

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
