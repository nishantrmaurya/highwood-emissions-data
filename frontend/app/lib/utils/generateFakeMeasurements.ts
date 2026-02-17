import { faker } from "@faker-js/faker";
import type { IngestBatchPayload } from "@/app/lib/api/MeasurementApiService";

export function generateFakeMeasurements(
  count: number,
): IngestBatchPayload["measurements"] {
  const now = Date.now();

  return Array.from({ length: count }, () => ({
    measured_at: faker.date
      .between({
        from: new Date(now - 24 * 60 * 60 * 1000),
        to: new Date(now),
      })
      .toISOString(),
    emission_value: faker.number.float({
      min: 0.01,
      max: 750,
      fractionDigits: 6,
    }),
    unit: faker.helpers.arrayElement(["kg", "tonne", "scf", "ppm"]),
    raw_payload: {
      sensor_id: faker.string.alphanumeric(8).toUpperCase(),
      source: "faker_batch_generation",
      operator: faker.person.firstName(),
      region: faker.location.state(),
    },
  }));
}
