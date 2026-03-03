import { pool } from "./db.js";
import pgvector from "pgvector/pg";
import { v4 as uuid } from "uuid";

export async function addChunk({ source, text, embedding, meta = {} }) {
  const id = uuid();
  const filename = meta.filename || null;
  const chunkIndex = Number.isInteger(meta.chunkIndex) ? meta.chunkIndex : null;

  await pool.query(
    `
    INSERT INTO rag_chunks (id, source, filename, chunk_index, content, embedding)
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [id, source, filename, chunkIndex, text, pgvector.toSql(embedding)]
  );

  return id;
}

export async function listChunks(limit = 200) {
  const { rows } = await pool.query(
    `
    SELECT id, source, filename, chunk_index, created_at
    FROM rag_chunks
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [limit]
  );
  return rows;
}