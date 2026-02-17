import { UI_LABELS } from "@/app/lib/constants/labels";
import { formatUnderscoreLabel } from "@/app/lib/utils/formatText";
import type { Site } from "@/app/types/schema";

const LABELS = UI_LABELS.siteDetail;

interface SiteDetailsSectionProps {
  site: Site;
}

export default function SiteDetailsSection({ site }: SiteDetailsSectionProps) {
  return (
    <section className="mb-8 rounded border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">
        {LABELS.sections.siteDetails}
      </h2>
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <p>
          <strong>{LABELS.headers.siteName}:</strong> {site.site_name}
        </p>
        <p>
          <strong>{LABELS.headers.siteType}:</strong> {site.site_type}
        </p>
        <p>
          <strong>{LABELS.headers.status}:</strong> {site.status}
        </p>
        <p>
          <strong>{LABELS.headers.complianceStatus}:</strong>{" "}
          {formatUnderscoreLabel(site.current_compliance_status)}
        </p>
        <p>
          <strong>{LABELS.headers.emissionLimit}:</strong>{" "}
          {site.emission_limit.toFixed(6)}
        </p>
        <p>
          <strong>{LABELS.headers.totalEmissionsToDate}:</strong>{" "}
          {site.total_emissions_to_date.toFixed(6)}
        </p>
        <p>
          <strong>{LABELS.headers.latitude}:</strong>{" "}
          {site.latitude ?? UI_LABELS.common.nullValue}
        </p>
        <p>
          <strong>{LABELS.headers.longitude}:</strong>{" "}
          {site.longitude ?? UI_LABELS.common.nullValue}
        </p>
        <p>
          <strong>{LABELS.headers.lastMeasureAt}:</strong>{" "}
          {site.last_measurement_at
            ? new Date(site.last_measurement_at).toLocaleString()
            : UI_LABELS.common.nullValue}
        </p>
        <p>
          <strong>{LABELS.headers.deleteAt}:</strong>{" "}
          {site.deleted_at ?? UI_LABELS.common.nullValue}
        </p>
        <p>
          <strong>{LABELS.headers.createdAt}:</strong>{" "}
          {new Date(site.created_at).toLocaleString()}
        </p>
        <p>
          <strong>{LABELS.headers.updatedAt}:</strong>{" "}
          {new Date(site.updated_at).toLocaleString()}
        </p>
      </div>
      <div className="mt-3">
        <p className="mb-1 text-sm font-medium">{LABELS.headers.metadata}</p>
        <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
          {JSON.stringify(site.metadata, null, 2)}
        </pre>
      </div>
    </section>
  );
}
