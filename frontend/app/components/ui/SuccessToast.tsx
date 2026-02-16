"use client";

interface SuccessToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export default function SuccessToast({
  open,
  message,
  onClose,
}: SuccessToastProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 z-50 w-full max-w-sm rounded border border-green-200 bg-green-50 p-3 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-green-800">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-green-700 underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
