import type { Measurement } from "@/app/types/schema";

type MeasurementApiRecord = Omit<Measurement, "emission_value"> & {
  emission_value: number | string;
};

export class MeasurementModel {
  static fromApi(data: MeasurementApiRecord): Measurement {
    return {
      ...data,
      emission_value: Number(data.emission_value),
    };
  }
}
