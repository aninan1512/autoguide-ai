import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

import { connectDB } from "./db.js";
import Guide from "./models/Guide.js";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL, // optional if you deploy later
    ].filter(Boolean),
    credentials: true,
  })
);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

function buildGuidePrompt({ make, model, year, question }) {
  return `
You are an automotive maintenance assistant.

Vehicle: ${year} ${make} ${model}
User question: ${question}

Return a clear, structured maintenance guide with these sections (use headings):

1) Summary
2) Safety Warnings
3) Tools Needed
4) Parts / Supplies
5) Step-by-step Instructions (numbered)
6) Common Mistakes to Avoid
7) Estimated Time + Difficulty
8) When to Stop and Call a Mechanic

Rules:
- Keep it practical and beginner-friendly.
- Avoid dangerous advice.
- If unsure, say what to verify in the owner's manual or with a mechanic.
`;
}

function buildChatPrompt({ vehicle, originalQuestion, aiAnswer, followUp }) {
  return `
You are a helpful automotive assistant.
You must ONLY answer based on the provided context. If context is missing, ask a clarifying question.

Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}

Original question: ${originalQuestion}

Original guide answer:
${aiAnswer}

User follow-up question:
${followUp}

Reply in a short, clear way. Use bullet points if helpful.
`;
}

// ✅ Create guide (generate AI + store)
app.post("/api/guides", async (req, res) => {
  try {
    const { make, model, year, question } = req.body;

    if (!make || !model || !year || !question) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const prompt = buildGuidePrompt({ make, model, year, question });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const aiAnswer =
      response.output_text?.trim() || "No answer returned. Please try again.";

    const doc = await Guide.create({
      vehicle: { make, model, year },
      question,
      aiAnswer,
    });

    res.json({
      id: doc._id,
      vehicle: doc.vehicle,
      question: doc.question,
      aiAnswer: doc.aiAnswer,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("POST /api/guides error:", err);
    res.status(500).json({ error: "Failed to generate guide." });
  }
});

// ✅ Recent searches (left sidebar)
app.get("/api/searches", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 30);

    const items = await Guide.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("vehicle question createdAt");

    res.json(items);
  } catch (err) {
    console.error("GET /api/searches error:", err);
    res.status(500).json({ error: "Failed to fetch searches." });
  }
});

// ✅ Fetch one guide (Results page)
app.get("/api/guides/:id", async (req, res) => {
  try {
    const doc = await Guide.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Guide not found." });

    res.json(doc);
  } catch (err) {
    console.error("GET /api/guides/:id error:", err);
    res.status(500).json({ error: "Failed to fetch guide." });
  }
});

// ✅ Follow-up chat about the answer
app.post("/api/chat", async (req, res) => {
  try {
    const { guideId, message } = req.body;

    if (!guideId || !message) {
      return res.status(400).json({ error: "Missing guideId or message." });
    }

    const guide = await Guide.findById(guideId);
    if (!guide) return res.status(404).json({ error: "Guide not found." });

    const prompt = buildChatPrompt({
      vehicle: guide.vehicle,
      originalQuestion: guide.question,
      aiAnswer: guide.aiAnswer,
      followUp: message,
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const reply =
      response.output_text?.trim() || "I couldn't generate a reply. Try again.";

    res.json({ reply });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    res.status(500).json({ error: "Failed to chat." });
  }
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Backend running on ${PORT}`));
  })
  .catch((e) => {
    console.error("❌ DB connection failed:", e);
    process.exit(1);
  });
