import { prismaClient } from "../config/prisma/prismaClient.js";
import { CreateSiteInput } from "../models/site.schema.js";

export class SiteService {
  static async getAllSites() {
    return prismaClient.site.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
  }

  static async createSite(data: CreateSiteInput) {
    return prismaClient.site.create({
      data: {
        site_name: data.site_name,
        site_type: data.site_type,
        emission_limit: data.emission_limit,
        metadata: data.metadata,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  static async getSiteMetrics(siteId: number) {
    const site = await prismaClient.site.findUnique({
      where: { id: siteId },
      include: {
        measurements: {
          orderBy: { measured_at: "desc" },
        },
      },
    });

    if (!site) {
      return null;
    }

    return site;
  }
}
