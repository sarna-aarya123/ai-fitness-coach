"use client";

import { useEffect, useState } from "react";
import { getWeightEntries, WeightEntry } from "../../lib/api";
import WeightChart from "../components/WeightChart";
import WeightForm from "../components/WeightForm";
import WeightList from "../components/WeightList";

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchEntries() {
    try {
      const data = await getWeightEntries();
      setEntries(data);
      setError(null);
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

      <WeightForm onSuccess={handleAddSuccess} onError={handleError} />

      {loading || submitting ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <WeightChart entries={entries} />
          <WeightList entries={entries} onDelete={handleDelete} />
        </>
      )}
    </main>
  );
}
