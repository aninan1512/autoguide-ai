import fs from "fs";
import path from "path";
import fetch from "node-fetch"; // remove if Node >= 18

const DOCS_DIR = path.resolve(process.cwd(), "docs");
const SUPPORTED = new Set([".txt", ".md", ".pdf"]);

const API_BASE = process.env.API_BASE || "http://localhost:5000/api";

function makeSourceTitle(filename) {
  const base = path.basename(filename, path.extname(filename));
  return base
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function uploadFile(filePath) {
  const filename = path.basename(filePath);
  const sourceTitle = makeSourceTitle(filename);
  const ext = path.extname(filename).toLowerCase();

  const mime =
    ext === ".pdf"
      ? "application/pdf"
      : "text/plain";

  const formData = new FormData();
  formData.append("sourceTitle", sourceTitle);
  formData.append(
    "file",
    new Blob([fs.readFileSync(filePath)], { type: mime }),
    filename
  );

  const resp = await fetch(`${API_BASE}/rag/ingest`, {
    method: "POST",
    body: formData,
  });

  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.error || "Upload failed");

  return { filename, sourceTitle, jobId: json.jobId };
}

async function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ Missing docs folder: ${DOCS_DIR}`);
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
    const r = await uploadFile(fp);
    console.log(`✅ queued: ${r.filename} -> jobId=${r.jobId}`);
  }

  console.log("\nDone. Worker will process jobs in background.");
  console.log("Check chunks:");
  console.log("  http://localhost:5000/api/rag/chunks");
}

main().catch((e) => {
  console.error("❌ ingestAllDocs failed:", e);
  process.exit(1);
});