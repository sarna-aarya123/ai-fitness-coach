import datetime
from typing import Literal, Optional

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


@app.get("/health")
def health():
    return {"status": "ok"}