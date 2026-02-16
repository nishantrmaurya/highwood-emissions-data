// src/server.ts

import express, { Application, Request, Response } from "express";
import { loadEnv } from "./utils/loadEnv.ts";
import sitesRouter from "./routes/sites.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

loadEnv("/config/.env");

const app: Application = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());
app.use(sitesRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Highwood Emissions Data API is running!");
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
