import { Prisma } from "../config/prisma/generated/client.js";

export type BatchIngestionPayload = {
  batch_id: number;
  site_id: number;
  client_batch_id: string;
  inserted_count: number;
  received_at: Date;
  total_emissions_to_date: Prisma.Decimal;
  last_measurement_at: Date | null;
  current_compliance_status: string;
};

export type IngestBatchResult =
  | { status: "created"; data: BatchIngestionPayload }
  | { status: "duplicate"; data: BatchIngestionPayload }
  | { status: "site_not_found" }
  | { status: "client_batch_conflict"; existing_site_id: number };
