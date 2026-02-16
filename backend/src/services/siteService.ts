import { prismaClient } from "../config/prisma/prismaClient.js";
import { CreateSiteInput } from "../models/site.schema.js";

export class SiteService {
  static async createSite(data: CreateSiteInput) {
    // Only required fields for now
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
}
