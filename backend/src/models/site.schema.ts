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

export const createMeasurementSchema = z.object({
  measured_at: z.coerce.date(),
  emission_value: z.number().positive(),
  unit: z.enum(["kg", "tonne", "scf", "ppm"]),
  raw_payload: z.record(z.string(), z.any()).optional(),
}).strict();

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
