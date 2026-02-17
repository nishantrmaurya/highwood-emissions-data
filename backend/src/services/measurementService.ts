import { prismaClient } from "../config/prisma/prismaClient.js";
import {
  CreateMeasurementInput,
  IngestMeasurementsInput,
} from "../models/site.schema.js";
import { Prisma } from "../config/prisma/generated/client.js";
import type {
  BatchIngestionPayload,
  IngestBatchResult,
} from "./measurement.types.js";

export type { IngestBatchResult } from "./measurement.types.js";

export class MeasurementService {
  static async getLatestMeasurements() {
    return prismaClient.measurement.findMany({
      orderBy: {
        measured_at: "desc",
        id: "asc",
      },
      take: 100,
    });
  }

  static async addMeasurement(siteId: number, data: CreateMeasurementInput) {
    return prismaClient.$transaction(async (trx) => {
      const site = await trx.site.findUnique({
        where: { id: siteId },
        select: { id: true },
      });

      if (!site) {
        return null;
      }

      return trx.measurement.create({
        data: {
          site_id: siteId,
          measured_at: data.measured_at,
          emission_value: data.emission_value,
          unit: data.unit,
          raw_payload: data.raw_payload,
        },
      });
    });
  }

  static async ingestBatch(
    data: IngestMeasurementsInput,
  ): Promise<IngestBatchResult> {
    try {
      return await prismaClient.$transaction(async (trx) => {
        const site = await trx.site.findUnique({
          where: { id: data.site_id },
          select: { id: true },
        });

        if (!site) {
          return { status: "site_not_found" };
        }

        const existingBatch = await trx.ingestion_batch.findUnique({
          where: { client_batch_id: data.client_batch_id },
          select: {
            id: true,
            site_id: true,
            client_batch_id: true,
            received_at: true,
          },
        });

        if (existingBatch) {
          if (existingBatch.site_id !== data.site_id) {
            return {
              status: "client_batch_conflict",
              existing_site_id: existingBatch.site_id,
            };
          }

          const payload = await this.buildBatchIngestionPayload(
            trx,
            existingBatch.id,
            existingBatch.site_id,
            existingBatch.client_batch_id,
            existingBatch.received_at,
          );

          return {
            status: "duplicate",
            data: payload,
          };
        }

        const batch = await trx.ingestion_batch.create({
          data: {
            site_id: data.site_id,
            client_batch_id: data.client_batch_id,
          },
          select: {
            id: true,
            site_id: true,
            client_batch_id: true,
            received_at: true,
          },
        });

        const insertResult = await trx.measurement.createMany({
          data: data.measurements.map((measurement) => ({
            site_id: data.site_id,
            batch_id: batch.id,
            measured_at: measurement.measured_at,
            emission_value: measurement.emission_value,
            unit: measurement.unit,
            raw_payload: measurement.raw_payload,
          })),
        });

        await trx.ingestion_batch.update({
          where: { id: batch.id },
          data: { processed: true },
        });

        const payload = await this.buildBatchIngestionPayload(
          trx,
          batch.id,
          batch.site_id,
          batch.client_batch_id,
          batch.received_at,
          insertResult.count,
        );

        return {
          status: "created",
          data: payload,
        };
      });
    } catch (error) {
      if (!this.isClientBatchUniqueViolation(error)) {
        throw error;
      }

      const existingBatch = await prismaClient.ingestion_batch.findUnique({
        where: { client_batch_id: data.client_batch_id },
        select: {
          id: true,
          site_id: true,
          client_batch_id: true,
          received_at: true,
        },
      });

      if (!existingBatch) {
        throw error;
      }

      if (existingBatch.site_id !== data.site_id) {
        return {
          status: "client_batch_conflict",
          existing_site_id: existingBatch.site_id,
        };
      }

      const payload = await prismaClient.$transaction((trx) =>
        this.buildBatchIngestionPayload(
          trx,
          existingBatch.id,
          existingBatch.site_id,
          existingBatch.client_batch_id,
          existingBatch.received_at,
        ),
      );

      return {
        status: "duplicate",
        data: payload,
      };
    }
  }

  private static async buildBatchIngestionPayload(
    trx: Prisma.TransactionClient,
    batchId: number,
    siteId: number,
    clientBatchId: string,
    receivedAt: Date,
    insertedCount?: number,
  ): Promise<BatchIngestionPayload> {
    const [resolvedInsertedCount, site] = await Promise.all([
      insertedCount !== undefined
        ? Promise.resolve(insertedCount)
        : trx.measurement.count({ where: { batch_id: batchId } }),
      trx.site.findUnique({
        where: { id: siteId },
        select: {
          total_emissions_to_date: true,
          last_measurement_at: true,
          current_compliance_status: true,
        },
      }),
    ]);

    if (!site) {
      throw new Error("Site not found while building batch ingestion payload");
    }

    return {
      batch_id: batchId,
      site_id: siteId,
      client_batch_id: clientBatchId,
      inserted_count: resolvedInsertedCount,
      received_at: receivedAt,
      total_emissions_to_date: site.total_emissions_to_date,
      last_measurement_at: site.last_measurement_at,
      current_compliance_status: site.current_compliance_status,
    };
  }

  private static isClientBatchUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }

    const prismaError = error as {
      code?: string;
      meta?: { target?: unknown };
    };

    if (prismaError.code !== "P2002") {
      return false;
    }

    const target = prismaError.meta?.target;
    return Array.isArray(target) && target.includes("client_batch_id");
  }
}
