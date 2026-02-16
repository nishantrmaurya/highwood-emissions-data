// src/server.ts

import express, { Application, Request, Response } from "express";
import { loadEnv } from "./utils/loadEnv.js";
import fs from "fs";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";
import { fileURLToPath } from "url";

loadEnv("/config/.env");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app: Application = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Dynamically load all routers from the routes folder and subfolders
const routesPath = path.join(__dirname, "routes");
async function loadRouters(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await loadRouters(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      const routerModule = await import(fullPath);
      const router = routerModule.default || routerModule;
      if (typeof router === "function") {
        app.use(router);
      }
    }
  }
}
loadRouters(routesPath);

app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "ok", message: "Highwood Emissions Data API is healthy" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
