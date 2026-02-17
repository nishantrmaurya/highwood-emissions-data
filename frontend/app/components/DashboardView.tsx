"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ManualMeasurementSection from "@/app/components/dashboard/ManualMeasurementSection";
import SelectedMeasurementsSection from "@/app/components/dashboard/SelectedMeasurementsSection";
import SitesTableSection from "@/app/components/dashboard/SitesTableSection";
import ErrorDialog from "@/app/components/ui/ErrorDialog";
import SuccessToast from "@/app/components/ui/SuccessToast";
import { formatErrorForDialog } from "@/app/lib/errors/formatErrorForDialog";
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
    const formatted = formatErrorForDialog(error);
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
      setSites((current) => {
        const siteExists = sitesRef.current.some(
          (site) => site.id === payload.id,
        );

        if (siteExists) {
          return current;
        }

        return [payload as Site, ...current];
      });

      openSuccessToast(LABELS.messages.siteListUpdatedRealtime);
    });

    const unsubscribeMeasurementCreated = realtimeClient.onMeasurementCreated(
      (payload) => {
        const parentSite = sitesRef.current.find(
          (site) => site.id === payload.site_id,
        );

        if (!parentSite) {
          return;
        }

        setSites((current) =>
          current.map((site) => {
            if (site.id !== payload.site_id) {
              return site;
            }

            const emissionValue = Number(payload.emission_value);
            const emissionDelta = Number.isFinite(emissionValue)
              ? emissionValue
              : 0;

            return {
              ...site,
              total_emissions_to_date:
                site.total_emissions_to_date + emissionDelta,
              last_measurement_at: payload.site.last_measurement_at,
            };
          }),
        );

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
      },
    );

    const unsubscribeMeasurementBatchIngested =
      realtimeClient.onMeasurementBatchIngested((payload) => {
        const parentSiteExists = sitesRef.current.some(
          (site) => site.id === payload.site_id,
        );

        if (!parentSiteExists) {
          return;
        }

        setSites((current) =>
          current.map((site) => {
            if (site.id !== payload.site_id) {
              return site;
            }

            const totalEmissionsToDate = Number(payload.total_emissions_to_date);

            return {
              ...site,
              total_emissions_to_date: Number.isFinite(totalEmissionsToDate)
                ? totalEmissionsToDate
                : site.total_emissions_to_date,
              last_measurement_at: payload.last_measurement_at,
              current_compliance_status:
                payload.current_compliance_status as Site["current_compliance_status"],
            };
          }),
        );

        if (
          selectedSiteIdRef.current === payload.site_id &&
          payload.measurements
        ) {
          setSelectedSiteMeasurements(payload.measurements);
        }
      });

    return () => {
      unsubscribeSiteCreated();
      unsubscribeMeasurementCreated();
      unsubscribeMeasurementBatchIngested();
    };
  }, [openSuccessToast]);

  const selectSiteForMeasurement = useCallback(
    async (siteId: number) => {
      setSelectedSiteId(siteId);
      await loadSiteMeasurements(siteId);
    },
    [loadSiteMeasurements],
  );

  const clearMeasurementForm = useCallback(() => {
    setMeasuredAt("");
    setEmissionValue("");
    setUnit("kg");
    setRawPayload("");
  }, []);

  const handleSubmitMeasurement = async (event: FormEvent<HTMLFormElement>) => {
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
      parsedRawPayload = parseJsonObject(
        parsed.data.raw_payload,
        "raw_payload",
      );
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
        <SitesTableSection
          sites={sites}
          loading={sitesLoading}
          onAddMeasurement={selectSiteForMeasurement}
        />
        <ManualMeasurementSection
          selectedSite={selectedSite}
          measuredAt={measuredAt}
          emissionValue={emissionValue}
          unit={unit}
          rawPayload={rawPayload}
          submitting={submittingMeasurement}
          onMeasuredAtChange={setMeasuredAt}
          onEmissionValueChange={setEmissionValue}
          onUnitChange={setUnit}
          onRawPayloadChange={setRawPayload}
          onSubmit={handleSubmitMeasurement}
          onCancel={() => setSelectedSiteId(null)}
        />
        <SelectedMeasurementsSection
          selectedSite={selectedSite}
          loading={selectedMeasurementsLoading}
          measurements={selectedSiteMeasurements}
        />
      </main>
    </>
  );
}
