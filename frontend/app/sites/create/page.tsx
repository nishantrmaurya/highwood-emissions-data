"use client";

import { useState } from "react";
import type { SiteStatus } from "@/app/types/schema";

const SITE_STATUSES: SiteStatus[] = [
  "active",
  "inactive",
  "maintenance",
  "decommissioned",
];

export default function CreateSitePage() {
  const [siteName, setSiteName] = useState("");
  const [siteType, setSiteType] = useState("");
  const [status, setStatus] = useState<SiteStatus>("active");
  const [emissionLimit, setEmissionLimit] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [metadata, setMetadata] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!siteName || !siteType || !emissionLimit) {
      setError("site_name, site_type, and emission_limit are required.");
      return;
    }

    if (metadata) {
      try {
        JSON.parse(metadata);
      } catch {
        setError("Metadata must be valid JSON.");
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess("Site payload validated against schema-aligned form fields.");
      setSiteName("");
      setSiteType("");
      setStatus("active");
      setEmissionLimit("");
      setLatitude("");
      setLongitude("");
      setMetadata("");
    }, 700);
  };

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Create a New Site</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded bg-white p-6 shadow"
      >
        <div>
          <label className="mb-1 block font-medium">
            site_name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block font-medium">
            site_type<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            value={siteType}
            onChange={(e) => setSiteType(e.target.value)}
            placeholder="well_pad, compressor_station, plant..."
            required
          />
        </div>

        <div>
          <label className="mb-1 block font-medium">status</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as SiteStatus)}
          >
            {SITE_STATUSES.map((siteStatus) => (
              <option key={siteStatus} value={siteStatus}>
                {siteStatus}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-medium">
            emission_limit<span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            className="w-full rounded border px-3 py-2"
            value={emissionLimit}
            onChange={(e) => setEmissionLimit(e.target.value)}
            required
            min={0}
            step="0.000001"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-medium">latitude</label>
            <input
              type="number"
              className="w-full rounded border px-3 py-2"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              step="0.0000001"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">longitude</label>
            <input
              type="number"
              className="w-full rounded border px-3 py-2"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              step="0.0000001"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-medium">metadata (JSON)</label>
          <textarea
            className="w-full rounded border px-3 py-2"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            rows={4}
            placeholder='{"owner":"Ops Team North"}'
          />
        </div>

        {error && <div className="font-medium text-red-600">{error}</div>}
        {success && <div className="font-medium text-green-600">{success}</div>}

        <button
          type="submit"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Validating..." : "Create New Site"}
        </button>
      </form>
    </main>
  );
}
