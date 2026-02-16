import { z } from "zod";

export const createSiteSchema = z.object({
  site_name: z.string().min(1),
  site_type: z.string().min(1),
  emission_limit: z.number(),
  metadata: z.record(z.string(), z.any()),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).strict();

export type CreateSiteInput = z.infer<typeof createSiteSchema>;

const measurementPayloadSchema = z.object({
  measured_at: z.coerce.date(),
  emission_value: z.number().positive(),
  unit: z.enum(["kg", "tonne", "scf", "ppm"]),
  raw_payload: z.record(z.string(), z.any()).optional(),
}).strict();

export const createMeasurementSchema = measurementPayloadSchema;

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;

export const ingestMeasurementsSchema = z.object({
  site_id: z.coerce.number().int().positive(),
  client_batch_id: z.string().trim().min(1).max(128),
  measurements: z.array(measurementPayloadSchema).min(1).max(100),
}).strict();

export type IngestMeasurementsInput = z.infer<typeof ingestMeasurementsSchema>;
