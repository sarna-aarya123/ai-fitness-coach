"use client";

import { useEffect, useState } from "react";
import { getGoal, getWeightEntries, Goal, WeightEntry } from "../../lib/api";
import GoalDisplay from "../components/GoalDisplay";
import WeightChart from "../components/WeightChart";
import WeightForm from "../components/WeightForm";
import WeightInsights from "../components/WeightInsights";
import WeightList from "../components/WeightList";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);

  async function fetchAIInsight(currentEntries: WeightEntry[], currentGoal: Goal | null) {
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai-insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: currentEntries, goal: currentGoal ?? null }),
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setAiInsight(data.insight);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }

  async function fetchEntries() {
    try {
      const [data, fetchedGoal] = await Promise.all([getWeightEntries(), getGoal()]);
      setEntries(data);
      setGoal(fetchedGoal);
      setError(null);
      await fetchAIInsight(data, fetchedGoal);
    } catch (err) {
      console.error(err);
      setError("Failed to load entries. Please try again.");
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchEntries().finally(() => setLoading(false));
  }, []);

  async function handleAddSuccess() {
    setSubmitting(true);
    await fetchEntries().finally(() => setSubmitting(false));
  }

  async function handleDelete(_id: number) {
    await fetchEntries();
  }

  function handleError(err: unknown) {
    console.error(err);
    setError("Something went wrong. Please try again.");
  }

  return (
    <main className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Weight Log</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 rounded px-4 py-2">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Log Weight</h2>
        <WeightForm onSuccess={handleAddSuccess} onError={handleError} />
      </section>

      {loading || submitting ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-3">AI Coach</h2>
            <div className="border rounded px-4 py-3 text-gray-700">
              {aiLoading
                ? "Thinking..."
                : aiInsight ?? "No insight yet."}
            </div>
          </section>

          {goal && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Goal Overview</h2>
              <GoalDisplay goal={goal} entries={entries} />
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-3">7-Day Insights</h2>
            <WeightInsights entries={entries} />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Weight Trend</h2>
            <WeightChart entries={entries} />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">History</h2>
            <WeightList entries={entries} onDelete={handleDelete} />
          </section>
        </>
      )}
    </main>
  );
}
