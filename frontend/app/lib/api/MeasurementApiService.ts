import { ApiClient } from "@/app/lib/api/ApiClient";
import { MeasurementModel } from "@/app/lib/models/MeasurementModel";
import type { EmissionUnit, Measurement } from "@/app/types/schema";

export interface CreateMeasurementPayload {
  measured_at: string;
  emission_value: number;
  unit: EmissionUnit;
  raw_payload?: Record<string, unknown>;
}

export class MeasurementApiService extends ApiClient {
  async addMeasurement(
    siteId: number,
    payload: CreateMeasurementPayload,
  ): Promise<Measurement> {
    const created = await this.post<Measurement>(
      `/site/${siteId}/measurements`,
      payload,
    );

    return MeasurementModel.fromApi(created);
  }
}
