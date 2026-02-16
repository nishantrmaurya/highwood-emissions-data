"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mockMeasurements, mockSites } from "@/app/data/mockData";
import type { EmissionUnit } from "@/app/types/schema";

const UNITS: EmissionUnit[] = ["kg", "tonne", "scf", "ppm"];

function formatCompliance(status: string) {
  return status.replaceAll("_", " ");
}

export default function DashboardView() {
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");
  const [emissionValue, setEmissionValue] = useState("");
  const [unit, setUnit] = useState<EmissionUnit>("kg");
  const [rawPayload, setRawPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedSite = useMemo(
    () => mockSites.find((site) => String(site.id) === selectedSiteId),
    [selectedSiteId],
  );

  const selectSiteForMeasurement = (siteId: number) => {
    setSelectedSiteId(String(siteId));
    setError("");
    setSuccess("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedSiteId || !measuredAt || !emissionValue || !unit) {
      setError("site_id, measured_at, emission_value, and unit are required.");
      return;
    }

    if (rawPayload) {
      try {
        JSON.parse(rawPayload);
      } catch {
        setError("raw_payload must be valid JSON.");
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess("Measurement payload validated for schema-aligned fields.");
      setMeasuredAt("");
      setEmissionValue("");
      setUnit("kg");
      setRawPayload("");
    }, 700);
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] p-4 lg:p-6">
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Sites</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed rounded-lg border border-gray-200 text-sm">
            <thead className="bg-blue-700">
              <tr>
                <th className="px-2 py-2 text-left text-white">site_name</th>
                <th className="px-2 py-2 text-left text-white">site_type</th>
                <th className="px-2 py-2 text-left text-white">status</th>
                <th className="px-2 py-2 text-left text-white">compliance</th>
                <th className="px-2 py-2 text-left text-white">
                  emission_limit
                </th>
                <th className="px-2 py-2 text-left text-white">
                  total_emissions_to_date
                </th>
                <th className="px-2 py-2 text-left text-white">
                  last_measurement_at
                </th>
                <th className="px-2 py-2 text-left text-white">actions</th>
              </tr>
            </thead>
            <tbody>
              {mockSites.map((site) => (
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
                      className={
                        site.current_compliance_status === "limit_exceeded"
                          ? "font-semibold text-red-600"
                          : site.current_compliance_status === "within_limit"
                            ? "font-semibold text-green-600"
                            : "font-semibold text-yellow-600"
                      }
                    >
                      {formatCompliance(site.current_compliance_status)}
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
                      : "No measurements"}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                      onClick={() => selectSiteForMeasurement(site.id)}
                    >
                      Add Measurement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">
          Manual Measurement Ingestion
        </h2>
        {!selectedSite ? (
          <div className="max-w-2xl rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
            Select <strong>Add Measurement</strong> from a site row to open the
            manual measurement form.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="max-w-2xl space-y-4 rounded bg-white p-6 shadow"
          >
            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
              <p>
                Selected Site: <strong>{selectedSite.site_name}</strong>
              </p>
              <p>
                Compliance:{" "}
                <strong>
                  {formatCompliance(selectedSite.current_compliance_status)}
                </strong>
              </p>
              <p>
                Last Measurement:{" "}
                <strong>
                  {selectedSite.last_measurement_at
                    ? new Date(
                        selectedSite.last_measurement_at,
                      ).toLocaleString()
                    : "No measurements"}
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium">
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
                <label className="mb-1 block font-medium">
                  emission_value<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={emissionValue}
                  onChange={(e) => setEmissionValue(e.target.value)}
                  required
                  min={0}
                  step="0.000001"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-medium">
                unit<span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded border px-3 py-2"
                value={unit}
                onChange={(e) => setUnit(e.target.value as EmissionUnit)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium">
                raw_payload (JSON)
              </label>
              <textarea
                className="w-full rounded border px-3 py-2"
                value={rawPayload}
                onChange={(e) => setRawPayload(e.target.value)}
                rows={3}
                placeholder='{"sensor":"A1","source":"manual"}'
              />
            </div>

            {error && <div className="font-medium text-red-600">{error}</div>}
            {success && (
              <div className="font-medium text-green-600">{success}</div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Validating..." : "Ingest Measurement"}
              </button>
              <button
                type="button"
                className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                onClick={() => setSelectedSiteId("")}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-semibold">Recent Measurements</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed rounded-lg border border-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left">id</th>
                <th className="px-2 py-2 text-left">site_id</th>
                <th className="px-2 py-2 text-left">measured_at</th>
                <th className="px-2 py-2 text-left">emission_value</th>
                <th className="px-2 py-2 text-left">unit</th>
              </tr>
            </thead>
            <tbody>
              {mockMeasurements.map((measurement) => (
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
      </section>
    </main>
  );
}
