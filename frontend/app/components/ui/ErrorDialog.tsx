"use client";

interface ErrorDialogProps {
  open: boolean;
  title?: string;
  message: string;
  details?: string;
  onClose: () => void;
}

export default function ErrorDialog({
  open,
  title = "Request Failed",
  message,
  details,
  onClose,
}: ErrorDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded bg-white p-5 shadow-lg">
        <h3 className="text-lg font-semibold text-red-700">{title}</h3>
        <p className="mt-2 text-sm text-gray-800">{message}</p>
        {details && (
          <pre className="mt-3 max-h-56 overflow-auto rounded bg-gray-100 p-3 text-xs text-gray-700">
            {details}
          </pre>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
