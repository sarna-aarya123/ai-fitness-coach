"use client";

import { useEffect, useState } from "react";
import { getGoal, getWeightEntries, Goal, WeightEntry } from "../../lib/api";
import GoalDisplay from "../components/GoalDisplay";
import GoalForm from "../components/GoalForm";
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
    <main className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-gray-900">AI Fitness Coach</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="bg-white border rounded-xl p-5 flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Log Weight</h2>
        <WeightForm onSuccess={handleAddSuccess} onError={handleError} />
      </section>

      {loading || submitting ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <>
          <section className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-blue-900">AI Coach</h2>
            <p className="text-blue-800 leading-relaxed">
              {aiLoading ? "Thinking…" : aiInsight ?? "No insight yet."}
            </p>
          </section>

          <section className="bg-white border rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Goal Overview</h2>
            <div>
              <p className="text-sm text-gray-500 mb-3">Set or update your target</p>
              <GoalForm onSuccess={fetchEntries} />
            </div>
            {goal && (
              <div className="border-t pt-4">
                <GoalDisplay goal={goal} entries={entries} />
              </div>
            )}
          </section>

          <section className="bg-white border rounded-xl p-5 flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-800">7-Day Insights</h2>
            <WeightInsights entries={entries} />
          </section>

          <section className="bg-white border rounded-xl p-5 flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-800">Weight Trend</h2>
            <WeightChart entries={entries} />
          </section>

          <section className="bg-white border rounded-xl p-5 flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-800">History</h2>
            <WeightList entries={entries} onDelete={handleDelete} />
          </section>
        </>
      )}
    </main>
  );
}
