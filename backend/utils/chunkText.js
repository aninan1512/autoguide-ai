export function chunkText(text, chunkSize = 900, overlap = 150) {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  const chunks = [];

  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + chunkSize, cleaned.length);
    const chunk = cleaned.slice(i, end);
    if (chunk.length > 50) chunks.push(chunk);

    i = end - overlap;
    if (i < 0) i = 0;
    if (end === cleaned.length) break;
  }

  return chunks;
}