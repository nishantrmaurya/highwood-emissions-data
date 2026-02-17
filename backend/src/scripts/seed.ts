process.env.NODE_ENV ??= "dev";

const { prismaClient } = await import("../config/prisma/prismaClient.js");

type EmissionUnit = "kg" | "tonne" | "scf" | "ppm";
type ComplianceStatus = "within_limit" | "limit_exceeded";

const SITE_BLUEPRINTS: Array<{ site_name: string; site_type: string }> = [
  {
    site_name: "Eagle Creek Compressor",
    site_type: "Natural Gas Compressor Station",
  },
  { site_name: "North Ridge Well Pad", site_type: "Oil & Gas Well Pad" },
  {
    site_name: "Prairie Sky Landfill",
    site_type: "Landfill Gas Recovery Facility",
  },
  { site_name: "Red Mesa Processing Plant", site_type: "Gas Processing Plant" },
  {
    site_name: "Bluewater Digester",
    site_type: "Wastewater Treatment Digester",
  },
  { site_name: "Silverline LNG Terminal", site_type: "LNG Storage Terminal" },
  {
    site_name: "Granite Valley Mine Vent",
    site_type: "Coal Mine Ventilation Shaft",
  },
  { site_name: "Green Pastures Dairy", site_type: "Dairy Anaerobic Digester" },
  {
    site_name: "Pioneer Biogas Upgrader",
    site_type: "Biogas Upgrading Facility",
  },
  {
    site_name: "Riverbend Storage Field",
    site_type: "Underground Gas Storage Field",
  },
];

const MEASUREMENT_UNITS: EmissionUnit[] = ["kg", "tonne", "scf", "ppm"];
const UNIT_TO_KG: Record<EmissionUnit, number> = {
  kg: 1,
  tonne: 1000,
  scf: 0.0192,
  ppm: 0.000001,
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(values: T[]): T {
  return values[randomInt(0, values.length - 1)];
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function randomMeasurementValue(unit: EmissionUnit): number {
  switch (unit) {
    case "kg":
      return round6(randomFloat(4, 220));
    case "tonne":
      return round6(randomFloat(0.015, 0.4));
    case "scf":
      return round6(randomFloat(450, 14000));
    case "ppm":
      return round6(randomFloat(800000, 12000000));
  }
}

function randomMeasuredAt(daysBack: number): Date {
  const now = Date.now();
  const oldest = now - daysBack * 24 * 60 * 60 * 1000;
  const timestamp = Math.floor(randomFloat(oldest, now));
  return new Date(timestamp);
}

async function seed(): Promise<void> {
  console.log("[seed] Starting database seed operation...");
  console.log(
    "[seed] Executing all seed operations in a single transaction...",
  );

  const summary = await prismaClient.$transaction(async (trx) => {
    console.log("[seed] Clearing existing measurement data...");
    await trx.measurement.deleteMany();
    console.log("[seed] Measurement data cleared.");

    console.log("[seed] Clearing existing ingestion batch data...");
    await trx.ingestion_batch.deleteMany();
    console.log("[seed] Ingestion batch data cleared.");

    console.log("[seed] Clearing existing site data...");
    await trx.site.deleteMany();
    console.log("[seed] Database cleared.");

    for (const [index, blueprint] of SITE_BLUEPRINTS.entries()) {
      const siteNumber = index + 1;
      console.log(
        `[seed] (${siteNumber}/${SITE_BLUEPRINTS.length}) Creating site "${blueprint.site_name}"...`,
      );

      const createdSite = await trx.site.create({
        data: {
          site_name: blueprint.site_name,
          site_type: blueprint.site_type,
          emission_limit: round6(randomFloat(1000, 4000)),
          metadata: {
            methane_monitoring_required: true,
            seeded: true,
            region: `region-${(index % 4) + 1}`,
          },
        },
      });
      console.log(
        `[seed] Site created. id=${createdSite.id}, name="${createdSite.site_name}", type="${createdSite.site_type}".`,
      );

      const measurementCount = randomInt(12, 45);
      console.log(
        `[seed] Generating ${measurementCount} measurements for site id=${createdSite.id}...`,
      );
      const measurements = Array.from(
        { length: measurementCount },
        (_, sample) => {
          const unit = pickRandom(MEASUREMENT_UNITS);
          const emissionValue = randomMeasurementValue(unit);
          const estimatedKg = round6(emissionValue * UNIT_TO_KG[unit]);

          return {
            site_id: createdSite.id,
            measured_at: randomMeasuredAt(60),
            emission_value: emissionValue,
            unit,
            raw_payload: {
              seeded: true,
              sensor_id: `CH4-${createdSite.id}-${sample + 1}`,
              estimated_kg: estimatedKg,
              methane_concentration_ppm: randomInt(1800, 190000),
            },
          };
        },
      );

      await trx.measurement.createMany({ data: measurements });
      console.log(
        `[seed] Inserted ${measurementCount} measurements for site id=${createdSite.id}.`,
      );

      const refreshedSite = await trx.site.findUnique({
        where: { id: createdSite.id },
        select: { total_emissions_to_date: true },
      });

      if (!refreshedSite) {
        throw new Error(
          `Unable to fetch site ${createdSite.id} after measurement seed.`,
        );
      }

      const totalEmissions = Number(refreshedSite.total_emissions_to_date);
      const keepWithinLimit = Math.random() >= 0.5;

      const emissionLimit = keepWithinLimit
        ? round6(
            totalEmissions +
              randomFloat(50, Math.max(200, totalEmissions * 0.35 + 50)),
          )
        : round6(Math.max(0.5, totalEmissions * randomFloat(0.55, 0.95)));

      const currentComplianceStatus: ComplianceStatus = keepWithinLimit
        ? "within_limit"
        : "limit_exceeded";

      console.log(
        `[seed] Updating emission_limit for site id=${createdSite.id} (${currentComplianceStatus})...`,
      );
      await trx.site.update({
        where: { id: createdSite.id },
        data: {
          emission_limit: emissionLimit,
          current_compliance_status: currentComplianceStatus,
        },
      });
      console.log(
        `[seed] Site id=${createdSite.id} updated. total_emissions=${totalEmissions.toFixed(6)} kg, emission_limit=${emissionLimit.toFixed(6)} kg, status=${currentComplianceStatus}.`,
      );
    }

    const [siteCount, measurementCount] = await Promise.all([
      trx.site.count(),
      trx.measurement.count(),
    ]);

    return { siteCount, measurementCount };
  });

  console.log("[seed] Seeding loop completed for all sites.");
  console.log("[seed] Transaction committed successfully.");
  console.log(
    `Seed complete. Inserted ${summary.siteCount} sites and ${summary.measurementCount} measurements.`,
  );
}

try {
  await seed();
} finally {
  console.log("[seed] Disconnecting Prisma client...");
  await prismaClient.$disconnect();
  console.log("[seed] Prisma client disconnected.");
}
