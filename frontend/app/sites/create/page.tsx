"use client";

import { FormEvent, useCallback, useState } from "react";
import ErrorDialog from "@/app/components/ui/ErrorDialog";
import SuccessToast from "@/app/components/ui/SuccessToast";
import { SiteApiService } from "@/app/lib/api/SiteApiService";
import { UI_LABELS } from "@/app/lib/constants/labels";
import { formatErrorForDialog } from "@/app/lib/errors/formatErrorForDialog";
import {
  createSiteFormSchema,
  parseJsonObject,
} from "@/app/lib/validation/schemas";
import { type CreateSiteFormState } from "@/app/types/createSiteForm";

const siteApi = new SiteApiService();

const initialFormState: CreateSiteFormState = {
  siteName: "",
  siteType: "",
  emissionLimit: "",
  latitude: "",
  longitude: "",
  metadata: "",
};

export default function CreateSitePage() {
  const [form, setForm] = useState<CreateSiteFormState>(initialFormState);
  const [loading, setLoading] = useState(false);

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<string>();

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const showError = useCallback((error: unknown) => {
    const formatted = formatErrorForDialog(
      error,
      UI_LABELS.common.unexpectedError,
    );
    setErrorMessage(formatted.message);
    setErrorDetails(formatted.details);
    setErrorOpen(true);
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialFormState);
  }, []);

  const setFormField = useCallback(
    <K extends keyof CreateSiteFormState>(
      field: K,
      value: CreateSiteFormState[K],
    ) => {
      setForm((previous) => ({ ...previous, [field]: value }));
    },
    [],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = createSiteFormSchema.safeParse({
      site_name: form.siteName,
      site_type: form.siteType,
      emission_limit: form.emissionLimit,
      latitude: form.latitude,
      longitude: form.longitude,
      metadata: form.metadata,
    });

    if (!parsed.success) {
      showError(
        new Error(
          parsed.error.issues[0]?.message || UI_LABELS.common.validationFailed,
        ),
      );
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
              {UI_LABELS.siteDetail.headers.siteName}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded border px-3 py-2"
              value={form.siteName}
              onChange={(event) => setFormField("siteName", event.target.value)}
              maxLength={120}
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">
              {UI_LABELS.siteDetail.headers.siteType}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded border px-3 py-2"
              value={form.siteType}
              onChange={(event) => setFormField("siteType", event.target.value)}
              maxLength={80}
              placeholder="well_pad, compressor_station, plant..."
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">
              {UI_LABELS.siteDetail.headers.emissionLimit}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className="w-full rounded border px-3 py-2"
              value={form.emissionLimit}
              onChange={(event) =>
                setFormField("emissionLimit", event.target.value)
              }
              required
              min={0.000001}
              step="0.000001"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium">
                {UI_LABELS.siteDetail.headers.latitude}
              </label>
              <input
                type="number"
                className="w-full rounded border px-3 py-2"
                value={form.latitude}
                onChange={(event) =>
                  setFormField("latitude", event.target.value)
                }
                step="0.0000001"
                min={-90}
                max={90}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">
                {UI_LABELS.siteDetail.headers.longitude}
              </label>
              <input
                type="number"
                className="w-full rounded border px-3 py-2"
                value={form.longitude}
                onChange={(event) =>
                  setFormField("longitude", event.target.value)
                }
                step="0.0000001"
                min={-180}
                max={180}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium">
              {UI_LABELS.siteDetail.headers.metadata}
            </label>
            <textarea
              className="w-full rounded border px-3 py-2"
              value={form.metadata}
              onChange={(event) => setFormField("metadata", event.target.value)}
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
