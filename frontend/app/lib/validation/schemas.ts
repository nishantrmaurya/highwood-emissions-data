import { z } from "zod";

const DECIMAL_18_6_MAX = 999999999999.999999;

export const createSiteFormSchema = z.object({
  site_name: z.string().trim().min(1, "site_name is required").max(120, "site_name must be 120 characters or less"),
  site_type: z.string().trim().min(1, "site_type is required").max(80, "site_type must be 80 characters or less"),
  emission_limit: z.coerce
    .number()
    .positive("emission_limit must be greater than 0")
    .max(DECIMAL_18_6_MAX, "emission_limit exceeds decimal(18,6) range"),
  latitude: z
    .union([z.coerce.number(), z.literal(""), z.undefined()])
    .transform((value) => (value === "" || value === undefined ? undefined : value))
    .refine(
      (value) => value === undefined || (value >= -90 && value <= 90),
      "latitude must be between -90 and 90",
    ),
  longitude: z
    .union([z.coerce.number(), z.literal(""), z.undefined()])
    .transform((value) => (value === "" || value === undefined ? undefined : value))
    .refine(
      (value) => value === undefined || (value >= -180 && value <= 180),
      "longitude must be between -180 and 180",
    ),
  metadata: z.string().optional(),
});

export const createMeasurementFormSchema = z.object({
  measured_at: z.string().trim().min(1, "measured_at is required"),
  emission_value: z.coerce
    .number()
    .positive("emission_value must be greater than 0")
    .max(DECIMAL_18_6_MAX, "emission_value exceeds decimal(18,6) range"),
  unit: z.enum(["kg", "tonne", "scf", "ppm"]),
  raw_payload: z.string().optional(),
});

export function parseJsonObject(
  raw: string | undefined,
  fieldName: string,
): Record<string, unknown> | undefined {
  if (!raw || raw.trim() === "") {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${fieldName} must be valid JSON`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${fieldName} must be a JSON object`);
  }

  return parsed as Record<string, unknown>;
}
