import openai from "../utils/openaiClient.js";

export async function embedText(text) {
  const resp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });
  return resp.data[0].embedding;
}