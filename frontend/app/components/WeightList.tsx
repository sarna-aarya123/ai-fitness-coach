"use client";

import { deleteWeightEntry, WeightEntry } from "../../lib/api";

interface WeightListProps {
  entries: WeightEntry[];
  onDelete: (id: number) => void;
}

export default function WeightList({ entries, onDelete }: WeightListProps) {
  if (entries.length === 0) {
    return <p className="text-gray-500">No weight entries yet.</p>;
  }

  async function handleDelete(id: number) {
    await deleteWeightEntry(id);
    onDelete(id);
  }

  return (
    <ul className="flex flex-col gap-2 max-w-sm">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between border rounded px-3 py-2"
        >
          <div>
            <span className="font-medium">
              {entry.weight} {entry.unit}
            </span>
            <span className="text-gray-500 text-sm ml-2">{entry.date}</span>
            {entry.note && (
              <p className="text-gray-600 text-sm">{entry.note}</p>
            )}
          </div>
          <button
            onClick={() => handleDelete(entry.id)}
            className="text-red-500 text-sm ml-4 hover:underline"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
