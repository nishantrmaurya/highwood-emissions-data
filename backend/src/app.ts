import express, { Application, Request, Response } from "express";
import { loadEnv } from "./utils/loadEnv.js";
import { errorHandler } from "./middleware/errorHandler.js";
import siteRouter from "./routes/site.js";
import measurementRouter from "./routes/measurement.js";

loadEnv();

const app: Application = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "ok", message: "Highwood Emissions Data API is healthy" });
});

app.use(siteRouter);
app.use(measurementRouter);

app.use(errorHandler);

export default app;
