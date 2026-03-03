import express from "express";
import multer from "multer";
import { z } from "zod";

import { enqueueIngestJob, getJob } from "../rag/jobs.js";
import { listChunks } from "../rag/store.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const IngestQuerySchema = z.object({
  mode: z.enum(["async", "sync"]).optional(), // default async
});

router.post("/ingest", upload.single("file"), async (req, res) => {
  const q = IngestQuerySchema.safeParse(req.query);
  const mode = q.success ? q.data.mode || "async" : "async";

  const sourceTitle = (req.body?.sourceTitle || "Uploaded Doc").toString();

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // Background mode: enqueue job and return jobId
  const jobId = await enqueueIngestJob({
    sourceTitle,
    filename: req.file.originalname,
    mime: req.file.mimetype || "text/plain",
    buffer: req.file.buffer,
  });

  return res.json({
    ok: true,
    mode: "async",
    jobId,
    message: "Queued for ingestion. Check /api/rag/jobs/:jobId",
  });
});

router.get("/jobs/:jobId", async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  return res.json({ ok: true, job });
});

router.get("/chunks", async (req, res) => {
  const chunks = await listChunks(500);
  res.json({ ok: true, chunks });
});

export default router;