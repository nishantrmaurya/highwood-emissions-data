// src/utils/loadEnv.ts
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

/**
 * Load environment variables based on NODE_ENV
 */
export function loadEnv(): void {
  // Vercel and other hosts may inject env vars directly without .env files.
  if (!process.env.NODE_ENV) {
    return;
  }

  const envName = process.env.NODE_ENV;
  const aliases: Record<string, string[]> = {
    production: ["prod"],
    prod: ["production"],
    development: ["dev"],
    dev: ["development"],
  };
  const envNames = [envName, ...(aliases[envName] ?? [])];

  const candidateFileNames = envNames.map((name) => `.env.${name}`);
  const candidatePaths = [
    ...candidateFileNames.map((fileName) =>
      path.resolve(process.cwd(), "src/config/env", fileName),
    ),
    ...candidateFileNames.map((fileName) =>
      path.resolve(process.cwd(), "config/env", fileName),
    ),
    ...candidateFileNames.map((fileName) =>
      path.resolve(process.cwd(), fileName),
    ),
  ] as const;

  const envFilePath = candidatePaths.find((candidatePath) =>
    fs.existsSync(candidatePath),
  );

  if (!envFilePath) {
    return;
  }

  const result = dotenv.config({ path: envFilePath });
  if (result.error) {
    throw result.error;
  }
}
