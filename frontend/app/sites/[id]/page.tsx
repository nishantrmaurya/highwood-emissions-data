"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { mockMeasurements, mockSites } from "@/app/data/mockData";
import type { EmissionUnit, Measurement } from "@/app/types/schema";

const UNITS: EmissionUnit[] = ["kg", "tonne", "scf", "ppm"];

function toPrettyLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function SiteDetailPage() {
  const params = useParams<{ id: string }>();
  const siteId = Number(params.id);

  const site = useMemo(
    () => mockSites.find((candidate) => candidate.id === siteId),
    [siteId],
  );

  const [measurements, setMeasurements] = useState<Measurement[]>(
    mockMeasurements.filter((measurement) => measurement.site_id === siteId),
  );
  const [measuredAt, setMeasuredAt] = useState("");
  const [emissionValue, setEmissionValue] = useState("");
  const [unit, setUnit] = useState<EmissionUnit>("kg");
  const [rawPayload, setRawPayload] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!Number.isInteger(siteId) || !site) {
    notFound();
  }

  const handleSingleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!measuredAt || !emissionValue || !unit) {
      setError("measured_at, emission_value, and unit are required.");
      return;
    }

    let parsedPayload: Measurement["raw_payload"] = null;
    if (rawPayload) {
      try {
        parsedPayload = JSON.parse(rawPayload) as Record<string, unknown>;
      } catch {
        setError("raw_payload must be valid JSON.");
        return;
      }
    }

    const maxExistingId = measurements.reduce(
      (maxId, measurement) => Math.max(maxId, measurement.id),
      1000,
    );

    const nextMeasurement: Measurement = {
      id: maxExistingId + 1,
      site_id: site.id,
      batch_id: null,
      measured_at: new Date(measuredAt).toISOString(),
      emission_value: Number(emissionValue),
      unit,
      raw_payload: parsedPayload,
      created_at: new Date().toISOString(),
    };

    setMeasurements((current) => [nextMeasurement, ...current]);
    setMeasuredAt("");
    setEmissionValue("");
    setUnit("kg");
    setRawPayload("");
    setSuccess("Single measurement added to the site view.");
  };

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{site.site_name}</h1>
          <p className="text-sm text-gray-700">site_id: {site.id}</p>
        </div>
        <Link
          href="/sites"
          className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
        >
          Back to Sites
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
            <strong>created_at:</strong> {new Date(site.created_at).toLocaleString()}
          </p>
          <p>
            <strong>updated_at:</strong> {new Date(site.updated_at).toLocaleString()}
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
                min={0}
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
                {UNITS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">raw_payload (JSON)</label>
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={3}
              placeholder='{"source":"manual_entry"}'
              value={rawPayload}
              onChange={(e) => setRawPayload(e.target.value)}
            />
          </div>

          {error && <p className="font-medium text-red-600">{error}</p>}
          {success && <p className="font-medium text-green-600">{success}</p>}

          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add Measurement
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
              {measurements.length > 0 ? (
                measurements.map((measurement) => (
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
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-center text-gray-600" colSpan={7}>
                    No measurements yet for this site.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
