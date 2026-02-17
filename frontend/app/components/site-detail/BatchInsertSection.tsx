import { type FormEvent } from "react";
import { UI_LABELS } from "@/app/lib/constants/labels";

const LABELS = UI_LABELS.siteDetail;

interface BatchInsertSectionProps {
  batchCount: string;
  submitting: boolean;
  canRetry: boolean;
  onBatchCountChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRetry: () => void;
}

export default function BatchInsertSection({
  batchCount,
  submitting,
  canRetry,
  onBatchCountChange,
  onSubmit,
  onRetry,
}: BatchInsertSectionProps) {
  return (
    <section
      id="batch-insert"
      className="mb-8 rounded border border-dashed border-gray-300 bg-gray-50 p-5"
    >
      <h2 className="mb-2 text-lg font-semibold">{LABELS.sections.batchInsert}</h2>
      <p className="mb-4 text-sm text-gray-700">
        {LABELS.messages.batchInsertDescription}
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="w-full md:max-w-xs">
          <label className="mb-1 block text-sm font-medium" htmlFor="batch-count">
            Number of measurements
            <span className="text-red-500">*</span>
          </label>
          <input
            id="batch-count"
            type="number"
            className="w-full rounded border px-3 py-2"
            value={batchCount}
            onChange={(event) => onBatchCountChange(event.target.value)}
            min={1}
            max={100}
            step={1}
            required
            placeholder={LABELS.placeholders.batchCount}
          />
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? LABELS.actions.saving : LABELS.actions.batchInsert}
        </button>

        {canRetry ? (
          <button
            type="button"
            className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
            onClick={onRetry}
            disabled={submitting}
          >
            {LABELS.actions.retryBatchInsert}
          </button>
        ) : null}
      </form>
    </section>
  );
}
