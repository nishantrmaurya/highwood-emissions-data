import type { Measurement, Site } from "@/app/types/schema";

const now = "2026-02-16T08:00:00.000Z";

export const mockSites: Site[] = [
  {
    id: 1,
    site_name: "Well Pad Alpha",
    site_type: "well_pad",
    status: "active",
    latitude: 56.1304,
    longitude: -106.3468,
    emission_limit: 1000,
    total_emissions_to_date: 500,
    metadata: { owner: "Ops Team North" },
    last_measurement_at: "2026-02-16T07:45:00.000Z",
    rolling_24h_emissions: 120,
    rolling_30d_emissions: 1400,
    current_compliance_status: "within_limit",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: 2,
    site_name: "Compressor Beta",
    site_type: "compressor_station",
    status: "maintenance",
    latitude: 53.5461,
    longitude: -113.4938,
    emission_limit: 800,
    total_emissions_to_date: 900,
    metadata: { owner: "Ops Team West" },
    last_measurement_at: "2026-02-15T19:12:00.000Z",
    rolling_24h_emissions: 210,
    rolling_30d_emissions: 3200,
    current_compliance_status: "limit_exceeded",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

export const mockMeasurements: Measurement[] = [
  {
    id: 1001,
    site_id: 1,
    batch_id: 501,
    measured_at: "2026-02-16T07:45:00.000Z",
    emission_value: 35.5,
    unit: "kg",
    raw_payload: { sensor: "A1" },
    created_at: now,
  },
  {
    id: 1002,
    site_id: 2,
    batch_id: null,
    measured_at: "2026-02-15T19:12:00.000Z",
    emission_value: 0.6,
    unit: "tonne",
    raw_payload: { source: "manual_entry" },
    created_at: now,
  },
];
