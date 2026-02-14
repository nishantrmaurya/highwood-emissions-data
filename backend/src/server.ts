// src/server.ts
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";

if (!process.env.NODE_ENV) {
  console.error(
    "NODE_ENV is not set. Please set it to 'dev', 'prod', or 'test'.",
  );
  process.exit(1);
}
dotenv.config({ path: `/config/.env.${process.env.NODE_ENV}` });

const app: Application = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Highwood Emissions Data API is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
