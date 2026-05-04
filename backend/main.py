from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os

from models import create_tables, get_db, Interaction
from agent import run_agent

app = FastAPI(title="CRM HCP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    create_tables()


# ─── SCHEMAS ──────────────────────────────────────────────────────────────────
class InteractionCreate(BaseModel):
    hcp_name: str
    hcp_specialty: Optional[str] = ""
    hcp_location: Optional[str] = ""
    interaction_type: str = "in-person"
    products_discussed: Optional[str] = ""
    notes: str
    follow_up_required: Optional[str] = "No"
    follow_up_notes: Optional[str] = ""
    rep_name: Optional[str] = "Field Rep"


class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    hcp_specialty: Optional[str] = None
    hcp_location: Optional[str] = None
    interaction_type: Optional[str] = None
    products_discussed: Optional[str] = None
    notes: Optional[str] = None
    follow_up_required: Optional[str] = None
    follow_up_notes: Optional[str] = None
    rep_name: Optional[str] = None
    sentiment: Optional[str] = None


class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = []


# ─── ROUTES ───────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "CRM HCP API running"}


@app.get("/interactions")
def get_interactions(db: Session = Depends(get_db)):
    interactions = db.query(Interaction).order_by(Interaction.created_at.desc()).all()
    return interactions


@app.get("/interactions/{interaction_id}")
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@app.post("/interactions")
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    from langchain_groq import ChatGroq
    from langchain_core.messages import HumanMessage
    import json
    from dotenv import load_dotenv
    load_dotenv()

    llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"), temperature=0.3)
    summary_prompt = f"""Summarize this HCP interaction in 2 sentences and identify sentiment.
Notes: {data.notes}
Products: {data.products_discussed}
Respond in JSON: {{"summary": "...", "sentiment": "positive|neutral|negative"}}"""
    try:
        resp = llm.invoke([HumanMessage(content=summary_prompt)])
        parsed = json.loads(resp.content.strip().replace("```json", "").replace("```", "").strip())
        summary = parsed.get("summary", data.notes[:200])
        sentiment = parsed.get("sentiment", "neutral")
    except:
        summary = data.notes[:200]
        sentiment = "neutral"

    interaction = Interaction(
        **data.dict(),
        summary=summary,
        sentiment=sentiment,
        interaction_date=datetime.utcnow()
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@app.put("/interactions/{interaction_id}")
def update_interaction(interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    for field, value in data.dict(exclude_none=True).items():
        setattr(interaction, field, value)
    interaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interaction)
    return interaction


@app.delete("/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": "Deleted"}


@app.post("/chat")
def chat(data: ChatMessage):
    try:
        response = run_agent(data.message, data.history)
        return {"response": response}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
