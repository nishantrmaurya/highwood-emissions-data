import EmptyState from "@/app/components/ui/EmptyState";
import { UI_LABELS } from "@/app/lib/constants/labels";
import type { Measurement } from "@/app/types/schema";

const LABELS = UI_LABELS.siteDetail;

interface MeasurementsSectionProps {
  measurements: Measurement[];
}

export default function MeasurementsSection({
  measurements,
}: MeasurementsSectionProps) {
  return (
    <section className="rounded border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">
        {LABELS.sections.measurements}
      </h2>
      {measurements.length === 0 ? (
        <EmptyState message={LABELS.placeholders.noMeasurementsForSite} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">{LABELS.headers.id}</th>
                <th className="px-4 py-2 text-left">{LABELS.headers.siteId}</th>
                <th className="px-4 py-2 text-left">
                  {LABELS.headers.batchId}
                </th>
                <th className="px-4 py-2 text-left">
                  {LABELS.headers.measuredAtTable}
                </th>
                <th className="px-4 py-2 text-left">
                  {LABELS.headers.emissionValueTable}
                </th>
                <th className="px-4 py-2 text-left">
                  {LABELS.headers.unitTable}
                </th>
                <th className="px-4 py-2 text-left">
                  {LABELS.headers.createdAtTable}
                </th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement) => (
                <tr key={measurement.id}>
                  <td className="px-4 py-2">{measurement.id}</td>
                  <td className="px-4 py-2">{measurement.site_id}</td>
                  <td className="px-4 py-2">
                    {measurement.batch_id ?? UI_LABELS.common.nullValue}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(measurement.measured_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    {measurement.emission_value.toFixed(6)}
                  </td>
                  <td className="px-4 py-2">{measurement.unit}</td>
                  <td className="px-4 py-2">
                    {new Date(measurement.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
