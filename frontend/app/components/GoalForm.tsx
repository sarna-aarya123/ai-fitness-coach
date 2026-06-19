"use client";

import { useState } from "react";
import { setGoal, ApiValidationError } from "../../lib/api";

interface GoalFormProps {
  onSuccess: () => void;
}

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

export default function GoalForm({ onSuccess }: GoalFormProps) {
  const [targetWeight, setTargetWeight] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await setGoal({
        target_weight: parseFloat(targetWeight),
        target_date: targetDate,
        unit,
      });
      onSuccess();
    } catch (err) {
      if (err instanceof ApiValidationError) {
        const detail = err.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          setError(detail[0].msg ?? "Validation error.");
        } else if (typeof detail === "string") {
          setError(detail);
        } else {
          setError("Invalid goal. Check that the date is in the future.");
        }
      } else {
        setError("Failed to save goal. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <div className="flex gap-2">
        <input
          type="number"
          value={targetWeight}
          onChange={(e) => setTargetWeight(e.target.value)}
          placeholder="Target weight"
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
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
        min={tomorrow()}
        required
        className="border rounded px-3 py-2"
      />

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Set Goal"}
      </button>
    </form>
  );
}
