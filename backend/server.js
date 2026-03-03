import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pino from "pino";

import agentRoutes from "./routes/agent.js";
import ragRoutes from "./routes/rag.js";
import { startRagWorker } from "./rag/worker.js";

const app = express();
const logger = pino();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/agent", agentRoutes);
app.use("/api/rag", ragRoutes);

app.use((err, req, res, next) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  startRagWorker();
});