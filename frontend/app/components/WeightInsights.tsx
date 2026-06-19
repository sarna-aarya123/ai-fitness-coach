import { WeightEntry } from "../../lib/api";

interface WeightInsightsProps {
  entries: WeightEntry[];
}

export default function WeightInsights({ entries }: WeightInsightsProps) {
  if (entries.length < 3) {
    return (
      <div className="border rounded px-4 py-3 text-gray-500">
        Not enough data for insights yet.
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const window = sorted.slice(-7);

  const first = window[0].weight;
  const last = window[window.length - 1].weight;
  const diff = last - first;
  const unit = window[window.length - 1].unit;

  let trend: string;
  if (diff < -0.3) trend = "losing weight";
  else if (diff > 0.3) trend = "gaining weight";
  else trend = "stable";

  const sign = diff > 0 ? "+" : "";

  return (
    <div className="border rounded px-4 py-3 flex flex-col gap-1">
      <p className="font-medium">7-day trend: {trend}</p>
      <p className="text-gray-600">
        Change: {sign}{diff.toFixed(1)} {unit}
      </p>
    </div>
  );
}
