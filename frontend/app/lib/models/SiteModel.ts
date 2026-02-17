import type { Site } from "@/app/types/schema";

type SiteApiRecord = Omit<
  Site,
  "emission_limit" | "total_emissions_to_date" | "latitude" | "longitude"
> & {
  emission_limit: number | string;
  total_emissions_to_date: number | string;
  latitude: number | string | null;
  longitude: number | string | null;
};

function toNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export class SiteModel {
  static fromApi(data: SiteApiRecord): Site {
    return {
      ...data,
      emission_limit: Number(data.emission_limit),
      total_emissions_to_date: Number(data.total_emissions_to_date),
      latitude: toNumber(data.latitude),
      longitude: toNumber(data.longitude),
    };
  }
}
