// src/server.ts
import express, { Application, Request, Response } from "express";
import { loadEnv } from "./utils/loadEnv";

loadEnv("/config/.env");

const app: Application = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Highwood Emissions Data API is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
