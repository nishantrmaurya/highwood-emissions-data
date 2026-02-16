import EmptyState from "@/app/components/ui/EmptyState";
import { UI_LABELS } from "@/app/lib/constants/labels";
import type { Measurement, Site } from "@/app/types/schema";

const LABELS = UI_LABELS.dashboard;

interface SelectedMeasurementsSectionProps {
  selectedSite: Site | null;
  loading: boolean;
  measurements: Measurement[];
}

export default function SelectedMeasurementsSection({
  selectedSite,
  loading,
  measurements,
}: SelectedMeasurementsSectionProps) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">
        {LABELS.sections.selectedSiteMeasurements}
      </h2>
      {!selectedSite ? (
        <EmptyState message={LABELS.emptyStates.noSiteSelected} />
      ) : loading ? (
        <EmptyState message={LABELS.emptyStates.loadingMeasurements} />
      ) : measurements.length === 0 ? (
        <EmptyState message={LABELS.emptyStates.noMeasurementsForSite} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed rounded-lg border border-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left">
                  {LABELS.tableHeaders.id}
                </th>
                <th className="px-2 py-2 text-left">
                  {LABELS.tableHeaders.siteId}
                </th>
                <th className="px-2 py-2 text-left">
                  {LABELS.tableHeaders.measuredAt}
                </th>
                <th className="px-2 py-2 text-left">
                  {LABELS.tableHeaders.emissionValue}
                </th>
                <th className="px-2 py-2 text-left">
                  {LABELS.tableHeaders.unit}
                </th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement) => (
                <tr key={measurement.id}>
                  <td className="px-2 py-2">{measurement.id}</td>
                  <td className="px-2 py-2">{measurement.site_id}</td>
                  <td className="truncate px-2 py-2">
                    {new Date(measurement.measured_at).toLocaleString()}
                  </td>
                  <td className="px-2 py-2">
                    {measurement.emission_value.toFixed(3)}
                  </td>
                  <td className="px-2 py-2">{measurement.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
