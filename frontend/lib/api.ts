const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface WeightEntryCreate {
  weight: number;
  unit: "kg" | "lbs";
  date: string;
  note?: string | null;
}

export interface WeightEntry extends WeightEntryCreate {
  id: number;
}

export interface Goal {
  target_weight: number;
  target_date: string;
  unit: "kg" | "lbs";
}

export class ApiValidationError extends Error {
  detail: unknown;
  constructor(message: string, detail: unknown) {
    super(message);
    this.name = "ApiValidationError";
    this.detail = detail;
  }
}

export async function getWeightEntries(): Promise<WeightEntry[]> {
  const res = await fetch(`${API_BASE}/weight`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function addWeightEntry(payload: WeightEntryCreate): Promise<WeightEntry> {
  const res = await fetch(`${API_BASE}/weight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function deleteWeightEntry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/weight/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.statusText);
}

export async function getGoal(): Promise<Goal | null> {
  const res = await fetch(`${API_BASE}/goal`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function setGoal(goal: Goal): Promise<Goal> {
  const res = await fetch(`${API_BASE}/goal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goal),
  });
  if (res.status === 422) {
    const body = await res.json();
    throw new ApiValidationError("Validation failed", body.detail ?? body);
  }
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
