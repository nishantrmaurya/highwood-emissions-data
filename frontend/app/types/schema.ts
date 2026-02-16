export type SiteStatus = "active" | "inactive" | "maintenance" | "decommissioned";

export type ComplianceStatus =
  | "within_limit"
  | "limit_exceeded"
  | "unknown";

export type EmissionUnit = "kg" | "tonne" | "scf" | "ppm";

export interface Site {
  id: number;
  site_name: string;
  site_type: string;
  status: SiteStatus;
  latitude: number | null;
  longitude: number | null;
  emission_limit: number;
  total_emissions_to_date: number;
  metadata: Record<string, unknown> | null;
  last_measurement_at: string | null;
  rolling_24h_emissions: number | null;
  rolling_30d_emissions: number | null;
  current_compliance_status: ComplianceStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Measurement {
  id: number;
  site_id: number;
  batch_id: number | null;
  measured_at: string;
  emission_value: number;
  unit: EmissionUnit;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}
