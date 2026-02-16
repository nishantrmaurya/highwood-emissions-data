"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/app/components/ui/EmptyState";
import ErrorDialog from "@/app/components/ui/ErrorDialog";
import SuccessToast from "@/app/components/ui/SuccessToast";
import { ApiError } from "@/app/lib/api/ApiError";
import { MeasurementApiService } from "@/app/lib/api/MeasurementApiService";
import { SiteApiService } from "@/app/lib/api/SiteApiService";
import { RealtimeClient } from "@/app/lib/socket/RealtimeClient";
import {
  createMeasurementFormSchema,
  parseJsonObject,
} from "@/app/lib/validation/schemas";
import type { EmissionUnit, Measurement, Site } from "@/app/types/schema";

const siteApi = new SiteApiService();
const measurementApi = new MeasurementApiService();
const realtimeClient = RealtimeClient.getInstance();

const UNITS: EmissionUnit[] = ["kg", "tonne", "scf", "ppm"];

function toPrettyLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatError(error: unknown): { message: string; details?: string } {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      details: error.details ? JSON.stringify(error.details, null, 2) : undefined,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unexpected error occurred" };
}

export default function SiteDetailPage() {
  const params = useParams<{ id: string }>();
  const siteId = Number(params.id);

  const [site, setSite] = useState<Site | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  const [measuredAt, setMeasuredAt] = useState("");
  const [emissionValue, setEmissionValue] = useState("");
  const [unit, setUnit] = useState<EmissionUnit>("kg");
  const [rawPayload, setRawPayload] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<string>();

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const showError = useCallback((error: unknown) => {
    const formatted = formatError(error);
    setErrorMessage(formatted.message);
    setErrorDetails(formatted.details);
    setErrorOpen(true);
  }, []);

  const loadSite = useCallback(async () => {
    try {
      setLoading(true);
      const metrics = await siteApi.getSiteMetrics(siteId);
      setSite(metrics.site);
      setMeasurements(metrics.measurements);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        notFound();
      }

      showError(error);
    } finally {
      setLoading(false);
    }
  }, [showError, siteId]);

  useEffect(() => {
    if (!Number.isInteger(siteId)) {
      notFound();
    }

    loadSite();
  }, [loadSite, siteId]);

  useEffect(() => {
    const unsubscribeMeasurementCreated =
      realtimeClient.onMeasurementCreated((payload) => {
        if (payload.site_id === siteId) {
          loadSite();
        }
      });

    return () => {
      unsubscribeMeasurementCreated();
    };
  }, [loadSite, siteId]);

  const handleSingleInsert = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = createMeasurementFormSchema.safeParse({
      measured_at: measuredAt,
      emission_value: emissionValue,
      unit,
      raw_payload: rawPayload,
    });

    if (!parsed.success) {
      showError(new Error(parsed.error.issues[0]?.message || "Validation failed"));
      return;
    }

    let parsedRawPayload: Record<string, unknown> | undefined;
    try {
      parsedRawPayload = parseJsonObject(parsed.data.raw_payload, "raw_payload");
    } catch (error) {
      showError(error);
      return;
    }

    try {
      setSubmitting(true);
      await measurementApi.addMeasurement(siteId, {
        measured_at: new Date(parsed.data.measured_at).toISOString(),
        emission_value: parsed.data.emission_value,
        unit: parsed.data.unit,
        raw_payload: parsedRawPayload,
      });

      setMeasuredAt("");
      setEmissionValue("");
      setUnit("kg");
      setRawPayload("");
      setSuccessMessage("Measurement added successfully.");
      setSuccessOpen(true);

      await loadSite();
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SuccessToast
        open={successOpen}
        message={successMessage}
        onClose={() => setSuccessOpen(false)}
      />
      <ErrorDialog
        open={errorOpen}
        message={errorMessage}
        details={errorDetails}
        onClose={() => setErrorOpen(false)}
      />

      <main className="mx-auto max-w-6xl p-8">
        {loading ? (
          <EmptyState message="Loading site details..." />
        ) : !site ? (
          <EmptyState message="Site not found." />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{site.site_name}</h1>
                <p className="text-sm text-gray-700">site_id: {site.id}</p>
              </div>
              <Link
                href="/"
                className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
              >
                Back to Dashboard
              </Link>
            </div>

            <section className="mb-8 rounded border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Site Details</h2>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <p>
                  <strong>site_name:</strong> {site.site_name}
                </p>
                <p>
                  <strong>site_type:</strong> {site.site_type}
                </p>
                <p>
                  <strong>status:</strong> {site.status}
                </p>
                <p>
                  <strong>current_compliance_status:</strong>{" "}
                  {toPrettyLabel(site.current_compliance_status)}
                </p>
                <p>
                  <strong>emission_limit:</strong> {site.emission_limit.toFixed(6)}
                </p>
                <p>
                  <strong>total_emissions_to_date:</strong>{" "}
                  {site.total_emissions_to_date.toFixed(6)}
                </p>
                <p>
                  <strong>rolling_24h_emissions:</strong>{" "}
                  {site.rolling_24h_emissions?.toFixed(6) ?? "null"}
                </p>
                <p>
                  <strong>rolling_30d_emissions:</strong>{" "}
                  {site.rolling_30d_emissions?.toFixed(6) ?? "null"}
                </p>
                <p>
                  <strong>latitude:</strong> {site.latitude ?? "null"}
                </p>
                <p>
                  <strong>longitude:</strong> {site.longitude ?? "null"}
                </p>
                <p>
                  <strong>last_measurement_at:</strong>{" "}
                  {site.last_measurement_at
                    ? new Date(site.last_measurement_at).toLocaleString()
                    : "null"}
                </p>
                <p>
                  <strong>deleted_at:</strong> {site.deleted_at ?? "null"}
                </p>
                <p>
                  <strong>created_at:</strong>{" "}
                  {new Date(site.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>updated_at:</strong>{" "}
                  {new Date(site.updated_at).toLocaleString()}
                </p>
              </div>
              <div className="mt-3">
                <p className="mb-1 text-sm font-medium">metadata</p>
                <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
                  {JSON.stringify(site.metadata, null, 2)}
                </pre>
              </div>
            </section>

            <section className="mb-8 rounded border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Add Single Measurement</h2>
              <form onSubmit={handleSingleInsert} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      measured_at<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full rounded border px-3 py-2"
                      value={measuredAt}
                      onChange={(e) => setMeasuredAt(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      emission_value<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full rounded border px-3 py-2"
                      value={emissionValue}
                      onChange={(e) => setEmissionValue(e.target.value)}
                      required
                      min={0.000001}
                      step="0.000001"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      unit<span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded border px-3 py-2"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as EmissionUnit)}
                    >
                      {UNITS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    raw_payload (JSON)
                  </label>
                  <textarea
                    className="w-full rounded border px-3 py-2"
                    rows={3}
                    placeholder='{"source":"manual_entry"}'
                    value={rawPayload}
                    onChange={(e) => setRawPayload(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Add Measurement"}
                </button>
              </form>
            </section>

            <section className="mb-8 rounded border border-dashed border-gray-300 bg-gray-50 p-5">
              <h2 className="mb-2 text-lg font-semibold">Batch Insert</h2>
              <p className="text-sm text-gray-700">
                Batch insert workflow is intentionally deferred. This section is
                reserved for CSV/JSON bulk upload and idempotent batch processing via
                ingestion batches.
              </p>
            </section>

            <section className="rounded border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Measurements</h2>
              {measurements.length === 0 ? (
                <EmptyState message="No measurements yet for this site." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full rounded-lg border border-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">id</th>
                        <th className="px-4 py-2 text-left">site_id</th>
                        <th className="px-4 py-2 text-left">batch_id</th>
                        <th className="px-4 py-2 text-left">measured_at</th>
                        <th className="px-4 py-2 text-left">emission_value</th>
                        <th className="px-4 py-2 text-left">unit</th>
                        <th className="px-4 py-2 text-left">created_at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((measurement) => (
                        <tr key={measurement.id}>
                          <td className="px-4 py-2">{measurement.id}</td>
                          <td className="px-4 py-2">{measurement.site_id}</td>
                          <td className="px-4 py-2">{measurement.batch_id ?? "null"}</td>
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
          </>
        )}
      </main>
    </>
  );
}
