import { ApiClient } from "@/app/lib/api/ApiClient";
import { MeasurementModel } from "@/app/lib/models/MeasurementModel";
import { SiteModel } from "@/app/lib/models/SiteModel";
import type { Measurement, Site } from "@/app/types/schema";

interface SiteMetricsApiResponse extends Site {
  measurements: Measurement[];
}

export interface SiteMetrics {
  site: Site;
  measurements: Measurement[];
}

export interface CreateSitePayload {
  site_name: string;
  site_type: string;
  emission_limit: number;
  metadata: Record<string, unknown>;
  latitude?: number;
  longitude?: number;
}

export class SiteApiService extends ApiClient {
  async getSites(): Promise<Site[]> {
    const records = await this.get<Site[]>("/sites");
    return records.map((record) => SiteModel.fromApi(record));
  }

  async getSiteMetrics(siteId: number): Promise<SiteMetrics> {
    const record = await this.get<SiteMetricsApiResponse>(
      `/sites/${siteId}/metrics`,
    );

    return {
      site: SiteModel.fromApi(record),
      measurements: record.measurements.map((measurement) =>
        MeasurementModel.fromApi(measurement),
      ),
    };
  }

  async createSite(payload: CreateSitePayload): Promise<Site> {
    const created = await this.post<Site>("/sites", payload);
    return SiteModel.fromApi(created);
  }
}
