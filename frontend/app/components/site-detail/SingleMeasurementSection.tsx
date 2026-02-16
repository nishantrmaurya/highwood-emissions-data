import { type FormEvent } from "react";
import { EMISSION_UNITS } from "@/app/lib/constants/emissionUnits";
import { UI_LABELS } from "@/app/lib/constants/labels";
import type { EmissionUnit } from "@/app/types/schema";

const LABELS = UI_LABELS.siteDetail;

interface SingleMeasurementSectionProps {
  measuredAt: string;
  emissionValue: string;
  unit: EmissionUnit;
  rawPayload: string;
  submitting: boolean;
  onMeasuredAtChange: (value: string) => void;
  onEmissionValueChange: (value: string) => void;
  onUnitChange: (value: EmissionUnit) => void;
  onRawPayloadChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function SingleMeasurementSection({
  measuredAt,
  emissionValue,
  unit,
  rawPayload,
  submitting,
  onMeasuredAtChange,
  onEmissionValueChange,
  onUnitChange,
  onRawPayloadChange,
  onSubmit,
}: SingleMeasurementSectionProps) {
  return (
    <section className="mb-8 rounded border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">
        {LABELS.sections.addSingleMeasurement}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {LABELS.headers.measuredAt}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              className="w-full rounded border px-3 py-2"
              value={measuredAt}
              onChange={(event) => onMeasuredAtChange(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {LABELS.headers.emissionValue}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className="w-full rounded border px-3 py-2"
              value={emissionValue}
              onChange={(event) => onEmissionValueChange(event.target.value)}
              required
              min={0.000001}
              step="0.000001"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {LABELS.headers.unit}
              <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded border px-3 py-2"
              value={unit}
              onChange={(event) =>
                onUnitChange(event.target.value as EmissionUnit)
              }
            >
              {EMISSION_UNITS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {LABELS.headers.rawPayload}
          </label>
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={3}
            placeholder={LABELS.placeholders.rawPayload}
            value={rawPayload}
            onChange={(event) => onRawPayloadChange(event.target.value)}
          />
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? LABELS.actions.saving : LABELS.actions.addMeasurement}
        </button>
      </form>
    </section>
  );
}
