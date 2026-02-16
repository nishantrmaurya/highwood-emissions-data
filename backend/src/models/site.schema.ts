import { z } from "zod";

export const createSiteSchema = z.object({
  site_name: z.string().min(1),
  site_type: z.string().min(1),
  emission_limit: z.number(),
  metadata: z.record(z.string(), z.any()),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
