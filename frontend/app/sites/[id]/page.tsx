"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import MeasurementsSection from "@/app/components/site-detail/MeasurementsSection";
import SingleMeasurementSection from "@/app/components/site-detail/SingleMeasurementSection";
import SiteDetailsSection from "@/app/components/site-detail/SiteDetailsSection";
import EmptyState from "@/app/components/ui/EmptyState";
import ErrorDialog from "@/app/components/ui/ErrorDialog";
import SuccessToast from "@/app/components/ui/SuccessToast";
import { ApiError } from "@/app/lib/api/ApiError";
import { MeasurementApiService } from "@/app/lib/api/MeasurementApiService";
import { SiteApiService } from "@/app/lib/api/SiteApiService";
import { UI_LABELS } from "@/app/lib/constants/labels";
import { formatErrorForDialog } from "@/app/lib/errors/formatErrorForDialog";
import { RealtimeClient } from "@/app/lib/socket/RealtimeClient";
import {
  createMeasurementFormSchema,
  parseJsonObject,
} from "@/app/lib/validation/schemas";
import type { EmissionUnit, Measurement, Site } from "@/app/types/schema";

const siteApi = new SiteApiService();
const measurementApi = new MeasurementApiService();
const realtimeClient = RealtimeClient.getInstance();
const LABELS = UI_LABELS.siteDetail;

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
    const formatted = formatErrorForDialog(error);
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
    const unsubscribeMeasurementCreated = realtimeClient.onMeasurementCreated(
      (payload) => {
        if (payload.site_id !== siteId) {
          return;
        }

        setMeasurements((current) => {
          const exists = current.some(
            (measurement) => measurement.id === payload.id,
          );

          if (exists) {
            return current;
          }

          return [
            {
              id: payload.id,
              site_id: payload.site_id,
              batch_id: null,
              measured_at: payload.measured_at,
              emission_value: Number(payload.emission_value),
              unit: payload.unit as EmissionUnit,
              raw_payload: null,
              created_at: payload.created_at,
            },
            ...current,
          ];
        });

        loadSite();
      },
    );

    return () => {
      unsubscribeMeasurementCreated();
    };
  }, [loadSite, siteId]);

  const handleSingleInsert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = createMeasurementFormSchema.safeParse({
      measured_at: measuredAt,
      emission_value: emissionValue,
      unit,
      raw_payload: rawPayload,
    });

    if (!parsed.success) {
      showError(
        new Error(
          parsed.error.issues[0]?.message || UI_LABELS.common.validationFailed,
        ),
      );
      return;
    }

    let parsedRawPayload: Record<string, unknown> | undefined;
    try {
      parsedRawPayload = parseJsonObject(
        parsed.data.raw_payload,
        "raw_payload",
      );
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
      setSuccessMessage(LABELS.messages.measurementAdded);
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
          <EmptyState message={LABELS.placeholders.loadingSiteDetails} />
        ) : !site ? (
          <EmptyState message={LABELS.placeholders.siteNotFound} />
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
                {LABELS.actions.backToDashboard}
              </Link>
            </div>

            <SiteDetailsSection site={site} />
            <SingleMeasurementSection
              measuredAt={measuredAt}
              emissionValue={emissionValue}
              unit={unit}
              rawPayload={rawPayload}
              submitting={submitting}
              onMeasuredAtChange={setMeasuredAt}
              onEmissionValueChange={setEmissionValue}
              onUnitChange={setUnit}
              onRawPayloadChange={setRawPayload}
              onSubmit={handleSingleInsert}
            />

            <section className="mb-8 rounded border border-dashed border-gray-300 bg-gray-50 p-5">
              <h2 className="mb-2 text-lg font-semibold">
                {LABELS.sections.batchInsert}
              </h2>
              <p className="text-sm text-gray-700">
                {LABELS.messages.batchInsertDescription}
              </p>
            </section>

            <MeasurementsSection measurements={measurements} />
          </>
        )}
      </main>
    </>
  );
}
