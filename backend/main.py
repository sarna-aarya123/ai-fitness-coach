import datetime
import os
from typing import Literal, Optional

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

class WeightEntryCreate(BaseModel):
    weight: float = Field(gt=0, le=500)
    unit: Literal["kg", "lbs"]
    date: datetime.date
    note: Optional[str] = Field(default=None, max_length=500)


class WeightEntry(WeightEntryCreate):
    id: int


weight_log: list[WeightEntry] = []
id_counter: int = 1


@app.post("/weight", response_model=WeightEntry)
def add_weight(entry: WeightEntryCreate):
    global id_counter
    new_entry = WeightEntry(id=id_counter, **entry.model_dump())
    weight_log.append(new_entry)
    id_counter += 1
    return new_entry


@app.get("/weight", response_model=list[WeightEntry])
def get_weight():
    return sorted(weight_log, key=lambda e: e.date, reverse=True)


@app.delete("/weight/{id}")
def delete_weight(id: int):
    for i, entry in enumerate(weight_log):
        if entry.id == id:
            weight_log.pop(i)
            return {"success": True}
    raise HTTPException(status_code=404, detail="Entry not found")


def _rule_based_insight(entries: list[WeightEntry]) -> str:
    sorted_entries = sorted(entries, key=lambda e: e.date)
    first = sorted_entries[0].weight
    last = sorted_entries[-1].weight
    diff = last - first
    unit = sorted_entries[-1].unit
    if diff < -0.3:
        return (
            f"You are trending downward consistently. "
            f"Your weight has decreased by {abs(diff):.1f} {unit} over the recorded period."
        )
    elif diff > 0.3:
        return (
            f"Your weight is trending upward by {diff:.1f} {unit}. "
            f"Consider reviewing your intake or activity."
        )
    return "Your weight has remained stable over this period."


@app.post("/ai-insight")
def ai_insight(entries: list[WeightEntry]):
    if len(entries) < 2:
        return {"insight": "Not enough data to generate an insight yet."}

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        sorted_entries = sorted(entries, key=lambda e: e.date)
        data_lines = "\n".join(
            f"- {e.date}: {e.weight} {e.unit}" + (f" (note: {e.note})" if e.note else "")
            for e in sorted_entries
        )
        prompt = (
            f"Here is a user's weight log:\n{data_lines}\n\n"
            "As a supportive fitness coach, provide a concise (2-3 sentence) insight about "
            "their progress, trends, and one actionable tip. Be encouraging and specific."
        )
        try:
            client = anthropic.Anthropic(api_key=api_key)
            message = client.messages.create(
                model="claude-opus-4-8",
                max_tokens=256,
                thinking={"type": "adaptive"},
                system="You are a knowledgeable and encouraging fitness coach. Keep responses concise and actionable.",
                messages=[{"role": "user", "content": prompt}],
            )
            text = next(
                (block.text for block in message.content if hasattr(block, "text")),
                None,
            )
            if text:
                return {"insight": text}
        except Exception:
            pass

    return {"insight": _rule_based_insight(entries)}


@app.get("/health")
def health():
    return {"status": "ok"}