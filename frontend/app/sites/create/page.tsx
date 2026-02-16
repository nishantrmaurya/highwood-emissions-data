"use client";

import { useState } from "react";
import ErrorDialog from "@/app/components/ui/ErrorDialog";
import SuccessToast from "@/app/components/ui/SuccessToast";
import { ApiError } from "@/app/lib/api/ApiError";
import { SiteApiService } from "@/app/lib/api/SiteApiService";
import {
  createSiteFormSchema,
  parseJsonObject,
} from "@/app/lib/validation/schemas";

const siteApi = new SiteApiService();

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

export default function CreateSitePage() {
  const [siteName, setSiteName] = useState("");
  const [siteType, setSiteType] = useState("");
  const [emissionLimit, setEmissionLimit] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [metadata, setMetadata] = useState("");
  const [loading, setLoading] = useState(false);

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<string>();

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const showError = (error: unknown) => {
    const formatted = formatError(error);
    setErrorMessage(formatted.message);
    setErrorDetails(formatted.details);
    setErrorOpen(true);
  };

  const resetForm = () => {
    setSiteName("");
    setSiteType("");
    setEmissionLimit("");
    setLatitude("");
    setLongitude("");
    setMetadata("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = createSiteFormSchema.safeParse({
      site_name: siteName,
      site_type: siteType,
      emission_limit: emissionLimit,
      latitude,
      longitude,
      metadata,
    });

    if (!parsed.success) {
      showError(new Error(parsed.error.issues[0]?.message || "Validation failed"));
      return;
    }

    let parsedMetadata: Record<string, unknown> = {};
    try {
      parsedMetadata = parseJsonObject(parsed.data.metadata, "metadata") ?? {};
    } catch (error) {
      showError(error);
      return;
    }

    try {
      setLoading(true);
      await siteApi.createSite({
        site_name: parsed.data.site_name,
        site_type: parsed.data.site_type,
        emission_limit: parsed.data.emission_limit,
        metadata: parsedMetadata,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
      });

      resetForm();
      setSuccessMessage("Site created successfully.");
      setSuccessOpen(true);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
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
              maxLength={120}
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
              maxLength={80}
              placeholder="well_pad, compressor_station, plant..."
              required
            />
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
              min={0.000001}
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
                min={-90}
                max={90}
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
                min={-180}
                max={180}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium">metadata (JSON object)</label>
            <textarea
              className="w-full rounded border px-3 py-2"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              rows={4}
              placeholder='{"owner":"Ops Team North"}'
            />
          </div>

          <button
            type="submit"
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create New Site"}
          </button>
        </form>
      </main>
    </>
  );
}
