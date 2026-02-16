import Link from "next/link";
import EmptyState from "@/app/components/ui/EmptyState";
import { UI_LABELS } from "@/app/lib/constants/labels";
import { formatUnderscoreLabel } from "@/app/lib/utils/formatText";
import type { Site } from "@/app/types/schema";

const LABELS = UI_LABELS.dashboard;

interface SitesTableSectionProps {
  sites: Site[];
  loading: boolean;
  onAddMeasurement: (siteId: number) => void;
}

function complianceClass(status: Site["current_compliance_status"]) {
  if (status === "limit_exceeded") {
    return "font-semibold text-red-600";
  }

  if (status === "within_limit") {
    return "font-semibold text-green-600";
  }

  return "font-semibold text-yellow-600";
}

export default function SitesTableSection({
  sites,
  loading,
  onAddMeasurement,
}: SitesTableSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold">{LABELS.sections.sites}</h2>
      {loading ? (
        <EmptyState message={LABELS.emptyStates.loadingSites} />
      ) : sites.length === 0 ? (
        <EmptyState message={LABELS.emptyStates.noSites} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed rounded-lg border border-gray-200 text-sm">
            <thead className="bg-blue-700">
              <tr>
                <th className="px-2 py-2 text-left text-white">
                  {LABELS.tableHeaders.siteName}
                </th>
                <th className="px-2 py-2 text-left text-white">
                  {LABELS.tableHeaders.siteType}
                </th>
                <th className="px-2 py-2 text-left text-white">
                  {LABELS.tableHeaders.status}
                </th>
                <th className="px-2 py-2 text-left text-white">
                  {LABELS.tableHeaders.compliance}
                </th>
                <th className="px-2 py-2 text-left text-white">
                  {LABELS.tableHeaders.emissionLimit}
                </th>
                <th className="px-2 py-2 text-left text-white">
                  {LABELS.tableHeaders.totalEmissionsToDate}
                </th>
                <th className="px-2 py-2 text-left text-white">
                  {LABELS.tableHeaders.lastMeasurementAt}
                </th>
                <th className="px-2 py-2 text-left text-white">
                  {LABELS.tableHeaders.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="border-t">
                  <td className="truncate px-2 py-2">
                    <Link
                      href={`/sites/${site.id}`}
                      className="font-medium text-blue-700 underline hover:text-blue-900"
                    >
                      {site.site_name}
                    </Link>
                  </td>
                  <td className="truncate px-2 py-2">{site.site_type}</td>
                  <td className="px-2 py-2">{site.status}</td>
                  <td className="px-2 py-2">
                    <span
                      className={complianceClass(
                        site.current_compliance_status,
                      )}
                    >
                      {formatUnderscoreLabel(site.current_compliance_status)}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {site.emission_limit.toFixed(3)}
                  </td>
                  <td className="px-2 py-2">
                    {site.total_emissions_to_date.toFixed(3)}
                  </td>
                  <td className="truncate px-2 py-2">
                    {site.last_measurement_at
                      ? new Date(site.last_measurement_at).toLocaleString()
                      : UI_LABELS.common.noMeasurements}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                      onClick={() => onAddMeasurement(site.id)}
                    >
                      {LABELS.actions.addMeasurement}
                    </button>
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
