import { Goal, WeightEntry } from "../../lib/api";

interface GoalDisplayProps {
  goal: Goal | null;
  entries: WeightEntry[];
}

function convertWeight(weight: number, from: "kg" | "lbs", to: "kg" | "lbs"): number {
  if (from === to) return weight;
  if (from === "lbs" && to === "kg") return weight * 0.453592;
  return weight * 2.20462;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function GoalDisplay({ goal, entries }: GoalDisplayProps) {
  if (!goal) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = parseLocalDate(goal.target_date);
  const daysRemaining = Math.round(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Sort ascending, take most recent 7 entries by count
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const window7 = sorted.slice(-7);
  const latest = sorted[sorted.length - 1];

  const currentWeight = latest
    ? convertWeight(latest.weight, latest.unit, goal.unit)
    : null;

  const remaining =
    currentWeight !== null ? goal.target_weight - currentWeight : null;

  const requiredPacePerWeek =
    remaining !== null && daysRemaining > 0
      ? (remaining / daysRemaining) * 7
      : null;

  // Actual pace from most recent 7 entries by count
  let actualPacePerDay: number | null = null;
  let actualPacePerWeek: number | null = null;
  if (window7.length >= 2) {
    const wFirst = convertWeight(window7[0].weight, window7[0].unit, goal.unit);
    const wLast = convertWeight(
      window7[window7.length - 1].weight,
      window7[window7.length - 1].unit,
      goal.unit
    );
    const d0 = parseLocalDate(window7[0].date);
    const d1 = parseLocalDate(window7[window7.length - 1].date);
    const daySpan = Math.max(
      Math.round((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24)),
      1
    );
    actualPacePerDay = (wLast - wFirst) / daySpan;
    actualPacePerWeek = actualPacePerDay * 7;
  }

  // Status
  let status: "On track" | "Ahead of pace" | "Behind pace" | null = null;
  if (requiredPacePerWeek !== null && actualPacePerWeek !== null) {
    if (Math.abs(requiredPacePerWeek) < 0.001) {
      status = "On track";
    } else {
      const ratio = actualPacePerWeek / requiredPacePerWeek;
      if (ratio >= 1.1) status = "Ahead of pace";
      else if (ratio >= 0.7) status = "On track";
      else status = "Behind pace";
    }
  }

  // Estimated completion date
  let etaText: string;
  if (actualPacePerDay === null) {
    etaText = "Log at least 2 entries to calculate ETA.";
  } else if (remaining === null) {
    etaText = "No entries logged yet.";
  } else {
    const daysToComplete = remaining / actualPacePerDay;
    if (!isFinite(daysToComplete) || daysToComplete <= 0) {
      etaText = "No ETA — trend is not moving toward goal";
    } else {
      const eta = new Date(today);
      eta.setDate(today.getDate() + Math.round(daysToComplete));
      etaText = formatDate(eta);
    }
  }

  const statusColor =
    status === "Ahead of pace"
      ? "text-green-600"
      : status === "Behind pace"
      ? "text-red-600"
      : "text-blue-600";

  const sign = (n: number) => (n > 0 ? "+" : "");

  return (
    <div className="border rounded px-4 py-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <span>
          <span className="text-gray-500 text-sm">Target </span>
          <span className="font-medium">
            {goal.target_weight} {goal.unit}
          </span>
        </span>
        <span>
          <span className="text-gray-500 text-sm">By </span>
          <span className="font-medium">{formatDate(targetDate)}</span>
        </span>
        <span>
          <span className="text-gray-500 text-sm">Days left </span>
          <span className="font-medium">{daysRemaining}</span>
        </span>
      </div>

      {currentWeight !== null && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
          <span>
            Current:{" "}
            <span className="font-medium">
              {currentWeight.toFixed(1)} {goal.unit}
            </span>
          </span>
          {remaining !== null && (
            <span>
              Remaining:{" "}
              <span className="font-medium">
                {sign(remaining)}{remaining.toFixed(1)} {goal.unit}
              </span>
            </span>
          )}
        </div>
      )}

      {requiredPacePerWeek !== null && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
          <span>
            Required pace:{" "}
            <span className="font-medium">
              {sign(requiredPacePerWeek)}{requiredPacePerWeek.toFixed(2)} {goal.unit}/week
            </span>
          </span>
          {actualPacePerWeek !== null && (
            <span>
              Current pace:{" "}
              <span className="font-medium">
                {sign(actualPacePerWeek)}{actualPacePerWeek.toFixed(2)} {goal.unit}/week
              </span>
            </span>
          )}
        </div>
      )}

      {status && (
        <p className={`font-semibold text-sm ${statusColor}`}>{status}</p>
      )}

      <p className="text-sm text-gray-600">
        <span className="text-gray-500">Est. completion: </span>
        <span className="font-medium">{etaText}</span>
      </p>
    </div>
  );
}
