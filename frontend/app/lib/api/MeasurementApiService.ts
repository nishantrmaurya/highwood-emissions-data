import { ApiClient } from "@/app/lib/api/ApiClient";
import { MeasurementModel } from "@/app/lib/models/MeasurementModel";
import type { EmissionUnit, Measurement } from "@/app/types/schema";

export interface CreateMeasurementPayload {
  measured_at: string;
  emission_value: number;
  unit: EmissionUnit;
  raw_payload?: Record<string, unknown>;
}

export interface IngestBatchMeasurementPayload {
  measured_at: string;
  emission_value: number;
  unit: EmissionUnit;
  raw_payload?: Record<string, unknown>;
}

export interface IngestBatchPayload {
  site_id: number;
  client_batch_id: string;
  measurements: IngestBatchMeasurementPayload[];
}

export interface IngestBatchResponse {
  batch_id: number;
  site_id: number;
  client_batch_id: string;
  inserted_count: number;
  received_at: string;
  total_emissions_to_date: number;
  last_measurement_at: string | null;
  current_compliance_status: "within_limit" | "limit_exceeded" | "unknown";
  duplicate_request: boolean;
}

export class MeasurementApiService extends ApiClient {
  async addMeasurement(
    siteId: number,
    payload: CreateMeasurementPayload,
  ): Promise<Measurement> {
    const created = await this.post<Measurement>(
      `/sites/${siteId}/measurements`,
      payload,
    );

    return MeasurementModel.fromApi(created);
  }

  async ingestBatch(payload: IngestBatchPayload): Promise<IngestBatchResponse> {
    return this.post<IngestBatchResponse>("/ingest", payload);
  }
}
