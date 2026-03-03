import { pool } from "../rag/db.js";
import pgvector from "pgvector/pg";
import { embedText } from "../rag/embed.js";

export async function retrieveDocs(query, topK = 4) {
  const qEmbedding = await embedText(query);

  const { rows } = await pool.query(
    `
    SELECT
      id,
      source,
      filename,
      chunk_index,
      content,
      1 - (embedding <=> $1) AS score
    FROM rag_chunks
    ORDER BY embedding <=> $1
    LIMIT $2
    `,
    [pgvector.toSql(qEmbedding), topK]
  );

  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    snippet: (r.content || "").slice(0, 600),
    meta: { filename: r.filename, chunkIndex: r.chunk_index },
    score: Number(Number(r.score || 0).toFixed(4)),
  }));
}