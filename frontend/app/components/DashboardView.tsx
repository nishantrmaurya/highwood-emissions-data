"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ErrorDialog from "@/app/components/ui/ErrorDialog";
import EmptyState from "@/app/components/ui/EmptyState";
import SuccessToast from "@/app/components/ui/SuccessToast";
import { ApiError } from "@/app/lib/api/ApiError";
import { MeasurementApiService } from "@/app/lib/api/MeasurementApiService";
import { SiteApiService } from "@/app/lib/api/SiteApiService";
import { UI_LABELS } from "@/app/lib/constants/labels";
import { RealtimeClient } from "@/app/lib/socket/RealtimeClient";
import {
  createMeasurementFormSchema,
  parseJsonObject,
} from "@/app/lib/validation/schemas";
import type { EmissionUnit, Measurement, Site } from "@/app/types/schema";

const siteApi = new SiteApiService();
const measurementApi = new MeasurementApiService();
const realtimeClient = RealtimeClient.getInstance();
const LABELS = UI_LABELS.dashboard;

const UNITS: EmissionUnit[] = ["kg", "tonne", "scf", "ppm"];

function formatCompliance(status: string) {
  return status.replaceAll("_", " ");
}

function formatError(error: unknown): { message: string; details?: string } {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      details: error.details
        ? JSON.stringify(error.details, null, 2)
        : undefined,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: UI_LABELS.common.unexpectedError };
}

export default function DashboardView() {
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);

  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedSiteMeasurements, setSelectedSiteMeasurements] = useState<
    Measurement[]
  >([]);
  const [selectedMeasurementsLoading, setSelectedMeasurementsLoading] =
    useState(false);

  const [measuredAt, setMeasuredAt] = useState("");
  const [emissionValue, setEmissionValue] = useState("");
  const [unit, setUnit] = useState<EmissionUnit>("kg");
  const [rawPayload, setRawPayload] = useState("");
  const [submittingMeasurement, setSubmittingMeasurement] = useState(false);

  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const [errorDialogDetails, setErrorDialogDetails] = useState<string>();

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const sitesRef = useRef<Site[]>([]);
  const selectedSiteIdRef = useRef<number | null>(null);

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? null,
    [sites, selectedSiteId],
  );

  useEffect(() => {
    sitesRef.current = sites;
  }, [sites]);

  useEffect(() => {
    selectedSiteIdRef.current = selectedSiteId;
  }, [selectedSiteId]);

  const openErrorDialog = useCallback((error: unknown) => {
    const formatted = formatError(error);
    setErrorDialogMessage(formatted.message);
    setErrorDialogDetails(formatted.details);
    setErrorDialogOpen(true);
  }, []);

  const openSuccessToast = useCallback((message: string) => {
    setSuccessMessage(message);
    setSuccessOpen(true);
  }, []);

  const loadSites = useCallback(async () => {
    try {
      setSitesLoading(true);
      const records = await siteApi.getSites();
      setSites(records);
    } catch (error) {
      openErrorDialog(error);
    } finally {
      setSitesLoading(false);
    }
  }, [openErrorDialog]);

  const loadSiteMeasurements = useCallback(
    async (siteId: number) => {
      try {
        setSelectedMeasurementsLoading(true);
        const metrics = await siteApi.getSiteMetrics(siteId);
        setSelectedSiteMeasurements(metrics.measurements);
      } catch (error) {
        openErrorDialog(error);
      } finally {
        setSelectedMeasurementsLoading(false);
      }
    },
    [openErrorDialog],
  );

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    const unsubscribeSiteCreated = realtimeClient.onSiteCreated((payload) => {
      const siteExists = sitesRef.current.some((site) => site.id === payload.id);

      if (siteExists) {
        return;
      }

      loadSites();
      openSuccessToast(LABELS.messages.siteListUpdatedRealtime);
    });

    const unsubscribeMeasurementCreated = realtimeClient.onMeasurementCreated(
      (payload) => {
        const parentSiteExists = sitesRef.current.some(
          (site) => site.id === payload.site_id,
        );

        if (!parentSiteExists) {
          return;
        }

        const isSelectedSite =
          selectedSiteIdRef.current &&
          payload.site_id === selectedSiteIdRef.current;

        if (isSelectedSite) {
          setSelectedSiteMeasurements((current) => {
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
        }

        loadSites();
      },
    );

    return () => {
      unsubscribeSiteCreated();
      unsubscribeMeasurementCreated();
    };
  }, [loadSites, openSuccessToast]);

  const selectSiteForMeasurement = async (siteId: number) => {
    setSelectedSiteId(siteId);
    await loadSiteMeasurements(siteId);
  };

  const clearMeasurementForm = () => {
    setMeasuredAt("");
    setEmissionValue("");
    setUnit("kg");
    setRawPayload("");
  };

  const handleSubmitMeasurement = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedSiteId) {
      openErrorDialog(new Error(LABELS.messages.selectSiteBeforeSubmit));
      return;
    }

    const parsed = createMeasurementFormSchema.safeParse({
      measured_at: measuredAt,
      emission_value: emissionValue,
      unit,
      raw_payload: rawPayload,
    });

    if (!parsed.success) {
      openErrorDialog(
        new Error(
          parsed.error.issues[0]?.message || UI_LABELS.common.validationFailed,
        ),
      );
      return;
    }

    let parsedRawPayload: Record<string, unknown> | undefined;
    try {
      parsedRawPayload = parseJsonObject(parsed.data.raw_payload, "raw_payload");
    } catch (error) {
      openErrorDialog(error);
      return;
    }

    try {
      setSubmittingMeasurement(true);
      await measurementApi.addMeasurement(selectedSiteId, {
        measured_at: new Date(parsed.data.measured_at).toISOString(),
        emission_value: parsed.data.emission_value,
        unit: parsed.data.unit,
        raw_payload: parsedRawPayload,
      });

      clearMeasurementForm();
      await Promise.all([loadSites(), loadSiteMeasurements(selectedSiteId)]);
      openSuccessToast(LABELS.messages.measurementSaved);
    } catch (error) {
      openErrorDialog(error);
    } finally {
      setSubmittingMeasurement(false);
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
        open={errorDialogOpen}
        message={errorDialogMessage}
        details={errorDialogDetails}
        onClose={() => setErrorDialogOpen(false)}
      />

      <main className="mx-auto w-full max-w-[1500px] p-4 lg:p-6">
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-semibold">{LABELS.sections.sites}</h2>
          {sitesLoading ? (
            <EmptyState message={LABELS.emptyStates.loadingSites} />
          ) : sites.length === 0 ? (
            <EmptyState message={LABELS.emptyStates.noSites} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed rounded-lg border border-gray-200 text-sm">
                <thead className="bg-blue-700">
                  <tr>
                    <th className="px-2 py-2 text-left text-white">{LABELS.tableHeaders.siteName}</th>
                    <th className="px-2 py-2 text-left text-white">{LABELS.tableHeaders.siteType}</th>
                    <th className="px-2 py-2 text-left text-white">{LABELS.tableHeaders.status}</th>
                    <th className="px-2 py-2 text-left text-white">{LABELS.tableHeaders.compliance}</th>
                    <th className="px-2 py-2 text-left text-white">{LABELS.tableHeaders.emissionLimit}</th>
                    <th className="px-2 py-2 text-left text-white">{LABELS.tableHeaders.totalEmissionsToDate}</th>
                    <th className="px-2 py-2 text-left text-white">{LABELS.tableHeaders.lastMeasurementAt}</th>
                    <th className="px-2 py-2 text-left text-white">{LABELS.tableHeaders.actions}</th>
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
                      <td className="px-2 py-2">{site.emission_limit.toFixed(3)}</td>
                      <td className="px-2 py-2">{site.total_emissions_to_date.toFixed(3)}</td>
                      <td className="truncate px-2 py-2">
                        {site.last_measurement_at
                          ? new Date(site.last_measurement_at).toLocaleString()
                          : UI_LABELS.common.noMeasurements}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                          onClick={() => selectSiteForMeasurement(site.id)}
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

        <section className="mb-8">
          <h2 className="mb-2 text-lg font-semibold">
            {LABELS.sections.manualMeasurementIngestion}
          </h2>
          {!selectedSite ? (
            <EmptyState message={LABELS.emptyStates.selectSiteToOpenForm} />
          ) : (
            <form
              onSubmit={handleSubmitMeasurement}
              className="max-w-2xl space-y-4 rounded bg-white p-6 shadow"
            >
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
                <p>
                  {LABELS.messages.selectedSite}: <strong>{selectedSite.site_name}</strong>
                </p>
                <p>
                  {LABELS.messages.compliance}:{" "}
                  <strong>{formatCompliance(selectedSite.current_compliance_status)}</strong>
                </p>
                <p>
                  {LABELS.messages.lastMeasurement}:{" "}
                  <strong>
                    {selectedSite.last_measurement_at
                      ? new Date(selectedSite.last_measurement_at).toLocaleString()
                      : UI_LABELS.common.noMeasurements}
                  </strong>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium">
                    {LABELS.form.measuredAt}<span className="text-red-500">*</span>
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
                    {LABELS.form.emissionValue}<span className="text-red-500">*</span>
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
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  {LABELS.form.unit}<span className="text-red-500">*</span>
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

              <div>
                <label className="mb-1 block font-medium">{LABELS.form.rawPayload}</label>
                <textarea
                  className="w-full rounded border px-3 py-2"
                  value={rawPayload}
                  onChange={(e) => setRawPayload(e.target.value)}
                  rows={3}
                  placeholder={LABELS.form.rawPayloadPlaceholder}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={submittingMeasurement}
                >
                  {submittingMeasurement
                    ? LABELS.actions.saving
                    : LABELS.actions.ingestMeasurement}
                </button>
                <button
                  type="button"
                  className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                  onClick={() => setSelectedSiteId(null)}
                >
                  {LABELS.actions.cancel}
                </button>
              </div>
            </form>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">
            {LABELS.sections.selectedSiteMeasurements}
          </h2>
          {!selectedSite ? (
            <EmptyState message={LABELS.emptyStates.noSiteSelected} />
          ) : selectedMeasurementsLoading ? (
            <EmptyState message={LABELS.emptyStates.loadingMeasurements} />
          ) : selectedSiteMeasurements.length === 0 ? (
            <EmptyState message={LABELS.emptyStates.noMeasurementsForSite} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed rounded-lg border border-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left">{LABELS.tableHeaders.id}</th>
                    <th className="px-2 py-2 text-left">{LABELS.tableHeaders.siteId}</th>
                    <th className="px-2 py-2 text-left">{LABELS.tableHeaders.measuredAt}</th>
                    <th className="px-2 py-2 text-left">{LABELS.tableHeaders.emissionValue}</th>
                    <th className="px-2 py-2 text-left">{LABELS.tableHeaders.unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSiteMeasurements.map((measurement) => (
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
      </main>
    </>
  );
}
