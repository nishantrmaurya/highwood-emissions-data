"use client";

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
      {message}
    </div>
  );
}
