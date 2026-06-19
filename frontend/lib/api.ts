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
