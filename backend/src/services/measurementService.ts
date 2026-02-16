import { prismaClient } from "../config/prisma/prismaClient.js";
import { CreateMeasurementInput } from "../models/site.schema.js";

export class MeasurementService {
  static async getLatestMeasurements() {
    return prismaClient.measurement.findMany({
      orderBy: {
        measured_at: "desc",
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
}
