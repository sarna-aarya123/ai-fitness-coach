import datetime
import os
from typing import Literal, Optional

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

class Goal(BaseModel):
    target_weight: float = Field(gt=0, le=500)
    target_date: datetime.date
    unit: Literal["kg", "lbs"]

    @field_validator("target_date")
    @classmethod
    def target_date_must_be_future(cls, v: datetime.date) -> datetime.date:
        if v <= datetime.date.today():
            raise ValueError("target_date must be strictly in the future")
        return v


class WeightEntryCreate(BaseModel):
    weight: float = Field(gt=0, le=500)
    unit: Literal["kg", "lbs"]
    date: datetime.date
    note: Optional[str] = Field(default=None, max_length=500)


class WeightEntry(WeightEntryCreate):
    id: int


weight_log: list[WeightEntry] = []
id_counter: int = 1
current_goal: Optional[Goal] = None


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


@app.post("/goal", response_model=Goal)
def set_goal(goal: Goal):
    global current_goal
    current_goal = goal
    return current_goal


@app.get("/goal", response_model=Optional[Goal])
def get_goal():
    return current_goal


class InsightRequest(BaseModel):
    entries: list[WeightEntry]
    goal: Optional[Goal] = None


def _convert_weight(weight: float, from_unit: str, to_unit: str) -> float:
    if from_unit == to_unit:
        return weight
    if from_unit == "lbs" and to_unit == "kg":
        return weight * 0.453592
    return weight * 2.20462


def _goal_pace_stats(entries: list[WeightEntry], goal: Goal) -> dict:
    sorted_entries = sorted(entries, key=lambda e: e.date)
    current_weight = _convert_weight(sorted_entries[-1].weight, sorted_entries[-1].unit, goal.unit)
    days_remaining = (goal.target_date - datetime.date.today()).days
    required_pace_per_week = (goal.target_weight - current_weight) / days_remaining * 7

    window = sorted_entries[-7:]
    actual_pace_per_week: Optional[float] = None
    status = "insufficient data"
    if len(window) >= 2:
        w_first = _convert_weight(window[0].weight, window[0].unit, goal.unit)
        w_last = _convert_weight(window[-1].weight, window[-1].unit, goal.unit)
        days_span = max((window[-1].date - window[0].date).days, 1)
        actual_pace_per_week = (w_last - w_first) / days_span * 7
        if abs(required_pace_per_week) < 0.001:
            status = "on track"
        else:
            ratio = actual_pace_per_week / required_pace_per_week
            if ratio >= 1.1:
                status = "ahead of pace"
            elif ratio >= 0.7:
                status = "on track"
            else:
                status = "behind pace"

    return {
        "current_weight": current_weight,
        "days_remaining": days_remaining,
        "required_pace_per_week": required_pace_per_week,
        "actual_pace_per_week": actual_pace_per_week,
        "status": status,
        "unit": goal.unit,
    }


def _rule_based_insight(entries: list[WeightEntry], goal: Optional[Goal] = None) -> str:
    sorted_entries = sorted(entries, key=lambda e: e.date)
    first = sorted_entries[0].weight
    last = sorted_entries[-1].weight
    diff = last - first
    unit = sorted_entries[-1].unit
    if diff < -0.3:
        trend = (
            f"You are trending downward consistently. "
            f"Your weight has decreased by {abs(diff):.1f} {unit} over the recorded period."
        )
    elif diff > 0.3:
        trend = (
            f"Your weight is trending upward by {diff:.1f} {unit}. "
            f"Consider reviewing your intake or activity."
        )
    else:
        trend = "Your weight has remained stable over this period."

    if goal is None:
        return trend

    stats = _goal_pace_stats(entries, goal)
    goal_line = (
        f"Your goal is {goal.target_weight} {stats['unit']} by {goal.target_date} "
        f"({stats['days_remaining']} days away)."
    )
    pace_line = f"Required pace: {stats['required_pace_per_week']:+.2f} {stats['unit']}/week."
    if stats["actual_pace_per_week"] is not None:
        pace_line += (
            f" Current pace: {stats['actual_pace_per_week']:+.2f} {stats['unit']}/week."
            f" Status: {stats['status']}."
        )
    return f"{trend} {goal_line} {pace_line}"


@app.post("/ai-insight")
def ai_insight(request: InsightRequest):
    entries = request.entries
    goal = request.goal

    if len(entries) < 2:
        return {"insight": "Not enough data to generate an insight yet."}

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        sorted_entries = sorted(entries, key=lambda e: e.date)
        data_lines = "\n".join(
            f"- {e.date}: {e.weight} {e.unit}" + (f" (note: {e.note})" if e.note else "")
            for e in sorted_entries
        )
        if goal is not None:
            stats = _goal_pace_stats(entries, goal)
            goal_section = (
                f"\nGoal: {goal.target_weight} {stats['unit']} by {goal.target_date} "
                f"({stats['days_remaining']} days remaining).\n"
                f"Required pace: {stats['required_pace_per_week']:+.2f} {stats['unit']}/week.\n"
            )
            if stats["actual_pace_per_week"] is not None:
                goal_section += (
                    f"Current pace: {stats['actual_pace_per_week']:+.2f} {stats['unit']}/week.\n"
                    f"Status: {stats['status']}.\n"
                )
            prompt = (
                f"Here is a user's weight log:\n{data_lines}\n"
                f"{goal_section}\n"
                "As a supportive fitness coach, provide a concise (2-3 sentence) insight about "
                "their progress relative to their goal, and one actionable tip. Be encouraging and specific."
            )
        else:
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

    return {"insight": _rule_based_insight(entries, goal)}


@app.get("/health")
def health():
    return {"status": "ok"}