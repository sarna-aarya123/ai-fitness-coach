"use client";

import { useState } from "react";
import { addWeightEntry } from "../../lib/api";

interface WeightFormProps {
  onSuccess: () => void;
  onError?: (err: unknown) => void;
}

const today = () => new Date().toISOString().split("T")[0];

export default function WeightForm({ onSuccess, onError }: WeightFormProps) {
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addWeightEntry({
        weight: parseFloat(weight),
        unit,
        date,
        note: note.trim() || null,
      });
      setWeight("");
      setUnit("kg");
      setDate(today());
      setNote("");
      onSuccess();
    } catch (err) {
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <div className="flex gap-2">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Weight"
          required
          min={0.1}
          max={500}
          step="any"
          className="border rounded px-3 py-2 w-full"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "kg" | "lbs")}
          className="border rounded px-3 py-2"
        >
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
        </select>
      </div>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        maxLength={500}
        className="border rounded px-3 py-2"
      />

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Log Weight"}
      </button>
    </form>
  );
}
