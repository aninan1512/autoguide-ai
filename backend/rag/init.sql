CREATE EXTENSION IF NOT EXISTS vector;

-- Stores RAG chunks + embeddings
CREATE TABLE IF NOT EXISTS rag_chunks (
  id UUID PRIMARY KEY,
  source TEXT NOT NULL,
  filename TEXT,
  chunk_index INT,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector index for cosine similarity
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_ivfflat
ON rag_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Background ingestion jobs
CREATE TABLE IF NOT EXISTS rag_ingest_jobs (
  id UUID PRIMARY KEY,
  source_title TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  data BYTEA NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued|processing|done|error
  chunks_added INT DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rag_ingest_jobs_status_idx
ON rag_ingest_jobs (status, created_at);