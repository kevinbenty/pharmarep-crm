import os
import json
from typing import TypedDict, Annotated, List
from datetime import datetime
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from sqlalchemy.orm import Session
from models import Interaction, SessionLocal

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.3
)


# ─── TOOL 1: Log Interaction ─────────────────────────────────────────────────
@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str,
    notes: str,
    products_discussed: str = "",
    hcp_specialty: str = "",
    hcp_location: str = "",
    follow_up_required: str = "No",
    follow_up_notes: str = "",
    rep_name: str = "Field Rep"
) -> str:
    """Log a new HCP interaction. Use this to save a new meeting/call/email with a healthcare professional."""
    db: Session = SessionLocal()
    try:
        # Use LLM to summarize & extract sentiment
        summary_prompt = f"""Summarize this HCP interaction in 2-3 sentences and identify sentiment.
HCP: {hcp_name} ({hcp_specialty})
Type: {interaction_type}
Products: {products_discussed}
Notes: {notes}

Respond in JSON: {{"summary": "...", "sentiment": "positive|neutral|negative"}}"""

        summary_response = llm.invoke([HumanMessage(content=summary_prompt)])
        try:
            parsed = json.loads(summary_response.content.strip().replace("```json", "").replace("```", "").strip())
            summary = parsed.get("summary", notes[:200])
            sentiment = parsed.get("sentiment", "neutral")
        except:
            summary = notes[:200]
            sentiment = "neutral"

        interaction = Interaction(
            hcp_name=hcp_name,
            hcp_specialty=hcp_specialty,
            hcp_location=hcp_location,
            interaction_type=interaction_type,
            products_discussed=products_discussed,
            notes=notes,
            summary=summary,
            sentiment=sentiment,
            follow_up_required=follow_up_required,
            follow_up_notes=follow_up_notes,
            rep_name=rep_name,
            interaction_date=datetime.utcnow()
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        return f"✅ Interaction logged successfully! ID: {interaction.id}. Summary: {summary}"
    except Exception as e:
        db.rollback()
        return f"❌ Error logging interaction: {str(e)}"
    finally:
        db.close()


# ─── TOOL 2: Edit Interaction ─────────────────────────────────────────────────
@tool
def edit_interaction(
    interaction_id: int,
    field: str,
    new_value: str
) -> str:
    """Edit an existing logged HCP interaction by ID. Fields: hcp_name, notes, products_discussed, follow_up_required, follow_up_notes, sentiment, interaction_type."""
    db: Session = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return f"❌ Interaction ID {interaction_id} not found."

        allowed_fields = ["hcp_name", "notes", "products_discussed", "follow_up_required",
                          "follow_up_notes", "sentiment", "interaction_type", "hcp_specialty", "hcp_location", "rep_name"]
        if field not in allowed_fields:
            return f"❌ Cannot edit field '{field}'. Allowed: {', '.join(allowed_fields)}"

        setattr(interaction, field, new_value)
        interaction.updated_at = datetime.utcnow()
        db.commit()
        return f"✅ Interaction {interaction_id} updated: {field} = '{new_value}'"
    except Exception as e:
        db.rollback()
        return f"❌ Error editing interaction: {str(e)}"
    finally:
        db.close()


# ─── TOOL 3: Get Interaction History ─────────────────────────────────────────
@tool
def get_interaction_history(hcp_name: str = "", limit: int = 10) -> str:
    """Retrieve past HCP interactions. Filter by HCP name or get recent interactions."""
    db: Session = SessionLocal()
    try:
        query = db.query(Interaction)
        if hcp_name:
            query = query.filter(Interaction.hcp_name.ilike(f"%{hcp_name}%"))
        interactions = query.order_by(Interaction.created_at.desc()).limit(limit).all()

        if not interactions:
            return f"No interactions found{' for ' + hcp_name if hcp_name else ''}."

        result = []
        for i in interactions:
            result.append(
                f"ID:{i.id} | {i.hcp_name} ({i.hcp_specialty}) | {i.interaction_type} | "
                f"{i.interaction_date.strftime('%Y-%m-%d') if i.interaction_date else 'N/A'} | "
                f"Sentiment:{i.sentiment} | Summary: {i.summary or i.notes[:100]}"
            )
        return "\n".join(result)
    except Exception as e:
        return f"❌ Error fetching history: {str(e)}"
    finally:
        db.close()


# ─── TOOL 4: Schedule Follow-up ───────────────────────────────────────────────
@tool
def schedule_follow_up(
    interaction_id: int,
    follow_up_notes: str
) -> str:
    """Schedule a follow-up for an HCP interaction. Marks it as requiring follow-up and adds notes."""
    db: Session = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return f"❌ Interaction ID {interaction_id} not found."

        interaction.follow_up_required = "Yes"
        interaction.follow_up_notes = follow_up_notes
        interaction.updated_at = datetime.utcnow()
        db.commit()
        return f"✅ Follow-up scheduled for {interaction.hcp_name} (Interaction ID: {interaction_id}). Notes: {follow_up_notes}"
    except Exception as e:
        db.rollback()
        return f"❌ Error scheduling follow-up: {str(e)}"
    finally:
        db.close()


# ─── TOOL 5: Analyze HCP Engagement ──────────────────────────────────────────
@tool
def analyze_hcp_engagement(hcp_name: str) -> str:
    """Analyze engagement patterns and generate insights for a specific HCP. Returns sentiment trends and recommendations."""
    db: Session = SessionLocal()
    try:
        interactions = db.query(Interaction).filter(
            Interaction.hcp_name.ilike(f"%{hcp_name}%")
        ).order_by(Interaction.created_at.desc()).all()

        if not interactions:
            return f"No interaction history found for {hcp_name}."

        sentiments = [i.sentiment for i in interactions]
        types = [i.interaction_type for i in interactions]
        products = [i.products_discussed for i in interactions if i.products_discussed]
        follow_ups = sum(1 for i in interactions if i.follow_up_required == "Yes")

        analysis_prompt = f"""Analyze this HCP engagement data and give sales recommendations:
HCP: {hcp_name}
Total Interactions: {len(interactions)}
Sentiment breakdown: {sentiments}
Interaction types: {types}
Products discussed: {products}
Pending follow-ups: {follow_ups}
Recent notes: {[i.notes[:100] for i in interactions[:3]]}

Provide: 1) Engagement summary 2) Sentiment trend 3) Top recommendation for next visit"""

        response = llm.invoke([HumanMessage(content=analysis_prompt)])
        return f"📊 Engagement Analysis for {hcp_name}:\n{response.content}"
    except Exception as e:
        return f"❌ Error analyzing engagement: {str(e)}"
    finally:
        db.close()


# ─── LANGGRAPH AGENT ──────────────────────────────────────────────────────────
tools = [log_interaction, edit_interaction, get_interaction_history, schedule_follow_up, analyze_hcp_engagement]
llm_with_tools = llm.bind_tools(tools)


class AgentState(TypedDict):
    messages: Annotated[List, lambda x, y: x + y]


SYSTEM_PROMPT = """You are an AI assistant for a pharmaceutical CRM system helping field sales representatives manage their HCP (Healthcare Professional) interactions.

You have access to these tools:
1. log_interaction - Save a new meeting/call/email with an HCP
2. edit_interaction - Update an existing interaction record
3. get_interaction_history - View past interactions with HCPs
4. schedule_follow_up - Mark an interaction for follow-up
5. analyze_hcp_engagement - Get AI insights on HCP engagement patterns

Be helpful, concise, and proactive. If a user describes a meeting, extract the details and log it. Always confirm actions taken."""


def agent_node(state: AgentState):
    messages = state["messages"]
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END


tool_node = ToolNode(tools)

graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

agent = graph.compile()


def run_agent(user_message: str, history: list = []) -> str:
    messages = []
    for h in history:
        if h["role"] == "user":
            messages.append(HumanMessage(content=h["content"]))
        elif h["role"] == "assistant":
            messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=user_message))

    result = agent.invoke({"messages": messages})
    last = result["messages"][-1]
    return last.content
