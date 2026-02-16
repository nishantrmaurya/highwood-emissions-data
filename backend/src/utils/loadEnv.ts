// src/utils/loadEnv.ts
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

/**
 * Load environment variables based on NODE_ENV
 */
export function loadEnv(): void {
  if (!process.env.NODE_ENV) {
    throw new Error(
      "NODE_ENV is not set. Please set it to one of: dev, prod, test.",
    );
  }

  const fileName = `.env.${process.env.NODE_ENV}`;
  const candidatePaths = [
    path.resolve(process.cwd(), "src/config/env", fileName),
    path.resolve(process.cwd(), "config/env", fileName),
    path.resolve(process.cwd(), fileName),
  ];

  const envFilePath = candidatePaths.find((candidatePath) =>
    fs.existsSync(candidatePath),
  );

  if (!envFilePath) {
    throw new Error(
      `No env file found for NODE_ENV=${process.env.NODE_ENV}. Checked: ${candidatePaths.join(
        ", ",
      )}`,
    );
  }

  const result = dotenv.config({ path: envFilePath });
  if (result.error) {
    throw result.error;
  }
}
