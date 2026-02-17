import { createServer } from "http";
import { initSocketServer } from "./socket/socketServer.js";
import app from "./app.js";

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const httpServer = createServer(app);

initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
