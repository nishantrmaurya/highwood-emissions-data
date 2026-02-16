import { type FormEvent } from "react";
import EmptyState from "@/app/components/ui/EmptyState";
import { EMISSION_UNITS } from "@/app/lib/constants/emissionUnits";
import { UI_LABELS } from "@/app/lib/constants/labels";
import { formatUnderscoreLabel } from "@/app/lib/utils/formatText";
import type { EmissionUnit, Site } from "@/app/types/schema";

const LABELS = UI_LABELS.dashboard;

interface ManualMeasurementSectionProps {
  selectedSite: Site | null;
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
  onCancel: () => void;
}

export default function ManualMeasurementSection({
  selectedSite,
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
  onCancel,
}: ManualMeasurementSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold">
        {LABELS.sections.manualMeasurementIngestion}
      </h2>
      {!selectedSite ? (
        <EmptyState message={LABELS.emptyStates.selectSiteToOpenForm} />
      ) : (
        <form
          onSubmit={onSubmit}
          className="max-w-2xl space-y-4 rounded bg-white p-6 shadow"
        >
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
            <p>
              {LABELS.messages.selectedSite}:{" "}
              <strong>{selectedSite.site_name}</strong>
            </p>
            <p>
              {LABELS.messages.compliance}:{" "}
              <strong>
                {formatUnderscoreLabel(selectedSite.current_compliance_status)}
              </strong>
            </p>
            <p>
              {LABELS.messages.lastMeasurement}:{" "}
              <strong>
                {selectedSite.last_measurement_at
                  ? new Date(selectedSite.last_measurement_at).toLocaleString()
                  : UI_LABELS.common.noMeasurements}
              </strong>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium">
                {LABELS.form.measuredAt}
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
              <label className="mb-1 block font-medium">
                {LABELS.form.emissionValue}
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
          </div>

          <div>
            <label className="mb-1 block font-medium">
              {LABELS.form.unit}
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

          <div>
            <label className="mb-1 block font-medium">
              {LABELS.form.rawPayload}
            </label>
            <textarea
              className="w-full rounded border px-3 py-2"
              value={rawPayload}
              onChange={(event) => onRawPayloadChange(event.target.value)}
              rows={3}
              placeholder={LABELS.form.rawPayloadPlaceholder}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting
                ? LABELS.actions.saving
                : LABELS.actions.ingestMeasurement}
            </button>
            <button
              type="button"
              className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
              onClick={onCancel}
            >
              {LABELS.actions.cancel}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
