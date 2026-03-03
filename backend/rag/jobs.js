import { pool } from "./db.js";
import { v4 as uuid } from "uuid";

export async function enqueueIngestJob({ sourceTitle, filename, mime, buffer }) {
  const id = uuid();

  await pool.query(
    `
    INSERT INTO rag_ingest_jobs (id, source_title, filename, mime, data, status)
    VALUES ($1, $2, $3, $4, $5, 'queued')
    `,
    [id, sourceTitle, filename, mime, buffer]
  );

  return id;
}

export async function getJob(jobId) {
  const { rows } = await pool.query(
    `SELECT id, source_title, filename, status, chunks_added, error, created_at, updated_at
     FROM rag_ingest_jobs
     WHERE id = $1`,
    [jobId]
  );
  return rows[0] || null;
}

export async function claimNextJob() {
  // Claim one queued job atomically
  const { rows } = await pool.query(
    `
    UPDATE rag_ingest_jobs
    SET status = 'processing', updated_at = NOW()
    WHERE id = (
      SELECT id
      FROM rag_ingest_jobs
      WHERE status = 'queued'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, source_title, filename, mime, data
    `
  );

  return rows[0] || null;
}

export async function markJobDone(jobId, chunksAdded) {
  await pool.query(
    `
    UPDATE rag_ingest_jobs
    SET status='done', chunks_added=$2, updated_at=NOW(), error=NULL
    WHERE id=$1
    `,
    [jobId, chunksAdded]
  );
}

export async function markJobError(jobId, message) {
  await pool.query(
    `
    UPDATE rag_ingest_jobs
    SET status='error', error=$2, updated_at=NOW()
    WHERE id=$1
    `,
    [jobId, message?.slice(0, 5000) || "Unknown error"]
  );
}