const pdfParse = (await import("pdf-parse")).default;
import { chunkText } from "../utils/chunkText.js";
import { embedText } from "./embed.js";
import { addChunk } from "./store.js";
import { claimNextJob, markJobDone, markJobError } from "./jobs.js";

let started = false;

async function processJob(job) {
  const { id, source_title, filename, mime, data } = job;

  let text = "";
  try {
    if ((mime || "").includes("pdf")) {
      const parsed = await pdfParse(Buffer.from(data));
      text = parsed.text || "";
    } else {
      text = Buffer.from(data).toString("utf-8");
    }

    const chunks = chunkText(text, 900, 150);
    let added = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(chunk);
      await addChunk({
        source: source_title,
        text: chunk,
        embedding,
        meta: { filename, chunkIndex: i },
      });
      added++;
    }

    await markJobDone(id, added);
  } catch (e) {
    await markJobError(id, e?.message || String(e));
  }
}

export function startRagWorker() {
  if (started) return;
  started = true;

  // poll loop
  setInterval(async () => {
    try {
      const job = await claimNextJob();
      if (!job) return;
      await processJob(job);
    } catch (e) {
      // worker should never crash
      console.error("RAG worker error:", e);
    }
  }, 1000);
}