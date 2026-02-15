// src/utils/loadEnv.ts
import dotenv from "dotenv";

/**
 * Load environment variables based on NODE_ENV
 * @param envPath - Path to the env file (e.g., '/config/.env' or 'src/config/.env')
 */
export function loadEnv(envPath: string): void {
  if (!process.env.NODE_ENV) {
    console.error(
      "NODE_ENV is not set. Please set it to 'dev', 'prod', or 'test'.",
    );
    process.exit(1);
  }

  dotenv.config({ path: `${envPath}.${process.env.NODE_ENV}` });
}
