// backend/scripts/ingestAllDocs.js
import fs from "fs";
import path from "path";

// Node 18+ has fetch/FormData/Blob built in.
// If you're on Node < 18, upgrade (recommended) OR uncomment the next line:
// import fetch from "node-fetch";

const DOCS_DIR = path.resolve(process.cwd(), "docs");
const SUPPORTED = new Set([".txt", ".md", ".pdf"]);

// Prefer INGEST_BASE_URL (what you tried to set), fallback to API_BASE.
// Accept either:
//   INGEST_BASE_URL=https://autoguide-ai.onrender.com
// or
//   API_BASE=https://autoguide-ai.onrender.com/api
const INGEST_BASE_URL = (process.env.INGEST_BASE_URL || "").trim();
const API_BASE_ENV = (process.env.API_BASE || "").trim();

// Build API base cleanly
const API_BASE = (() => {
  if (API_BASE_ENV) {
    // If they set API_BASE, assume it's already ".../api" (but handle if not)
    return API_BASE_ENV.endsWith("/api") ? API_BASE_ENV : `${API_BASE_ENV.replace(/\/$/, "")}/api`;
  }
  if (INGEST_BASE_URL) {
    // If they set INGEST_BASE_URL, append /api
    return `${INGEST_BASE_URL.replace(/\/$/, "")}/api`;
  }
  // Default local dev
  return "http://localhost:5000/api";
})();

function makeSourceTitle(filename) {
  const base = path.basename(filename, path.extname(filename));
  return base
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function guessMime(ext) {
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".md") return "text/markdown";
  return "text/plain";
}

async function uploadFile(filePath) {
  const filename = path.basename(filePath);
  const sourceTitle = makeSourceTitle(filename);
  const ext = path.extname(filename).toLowerCase();

  const mime = guessMime(ext);

  const formData = new FormData();
  formData.append("sourceTitle", sourceTitle);

  // Blob is fine for Node 18+. Use fs.readFileSync for simplicity.
  const buf = fs.readFileSync(filePath);
  formData.append("file", new Blob([buf], { type: mime }), filename);

  const url = `${API_BASE}/rag/ingest`;

  const resp = await fetch(url, {
    method: "POST",
    body: formData,
  });

  // If server returned HTML or empty, avoid JSON crash
  const text = await resp.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text || "Non-JSON response from server" };
  }

  if (!resp.ok) {
    throw new Error(json?.error || `Upload failed (${resp.status})`);
  }

  return { filename, sourceTitle, jobId: json.jobId };
}

async function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ Missing docs folder: ${DOCS_DIR}`);
    console.error(`Tip: ensure you are running from backend/ so "docs/" exists.`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(DOCS_DIR, f));

  if (!files.length) {
    console.log("⚠️ No .txt/.md/.pdf files found in docs/");
    process.exit(0);
  }

  console.log(`📚 Uploading ${files.length} docs to ${API_BASE}/rag/ingest\n`);

  for (const fp of files) {
    try {
      const r = await uploadFile(fp);
      console.log(`✅ queued: ${r.filename} -> jobId=${r.jobId}`);
    } catch (e) {
      console.error(`❌ failed: ${path.basename(fp)} -> ${e.message}`);
      // Continue uploading remaining files instead of stopping everything
    }
  }

  console.log("\nDone. Worker will process jobs in background.");
  console.log("Check chunks:");
  console.log(`  ${API_BASE}/rag/chunks`);
}

main().catch((e) => {
  console.error("❌ ingestAllDocs failed:", e);
  process.exit(1);
});