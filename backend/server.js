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
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/health", (req, res) => res.json({ ok: true }));
// Root route (for visiting the Render URL directly)
app.get("/", (req, res) => {
  res.send("AutoGuide AI backend is running ✅ Try /health or /api endpoints.");
});
function buildGuidePrompt({ make, model, year, question }) {
  return `
You are an automotive maintenance assistant.

Vehicle: ${year} ${make} ${model}
User question: ${question}

Return a clear, structured maintenance guide with these sections (use headings exactly):

## Summary
## Safety Warnings
## Tools Needed
## Parts / Supplies
## Step-by-step Instructions
## Common Mistakes to Avoid
## Estimated Time + Difficulty
## When to Stop and Call a Mechanic

Rules:
- Keep it practical and beginner-friendly.
- Avoid dangerous advice.
- If unsure, say what to verify in the owner's manual or with a mechanic.
`;
}

function buildChatPrompt({ vehicle, originalQuestion, aiAnswer, chatSoFar, followUp }) {
  const history = (chatSoFar || [])
    .slice(-10) // keep last 10 messages for context
    .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
    .join("\n");

  return `
You are a helpful automotive assistant.
Answer using ONLY the provided context. If context is missing, ask a clarifying question.

Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}

Original question: ${originalQuestion}

Original guide answer:
${aiAnswer}

Recent chat history:
${history || "(none)"}

User follow-up question:
${followUp}

Reply clearly and concisely. Use bullet points when helpful.
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

    const aiAnswer = (response.output_text || "").trim() || "No answer returned. Please try again.";

    const doc = await Guide.create({
      vehicle: { make, model, year },
      question,
      aiAnswer,
      chat: [
        {
          role: "assistant",
          text: "Ask anything about the guide (tools, steps, safety, parts, etc.).",
        },
      ],
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

// ✅ Recent searches (sidebar)
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

// ✅ Fetch one guide (now includes chat)
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

// ✅ Follow-up chat (persist user + assistant messages)
app.post("/api/chat", async (req, res) => {
  try {
    const { guideId, message } = req.body;

    if (!guideId || !message) {
      return res.status(400).json({ error: "Missing guideId or message." });
    }

    const guide = await Guide.findById(guideId);
    if (!guide) return res.status(404).json({ error: "Guide not found." });

    // Save user message first
    guide.chat.push({ role: "user", text: message });

    const prompt = buildChatPrompt({
      vehicle: guide.vehicle,
      originalQuestion: guide.question,
      aiAnswer: guide.aiAnswer,
      chatSoFar: guide.chat,
      followUp: message,
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const reply = (response.output_text || "").trim() || "I couldn't generate a reply. Try again.";

    // Save assistant reply
    guide.chat.push({ role: "assistant", text: reply });

    await guide.save();

    res.json({ reply, chat: guide.chat });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    res.status(500).json({ error: "Failed to chat." });
  }
});

// ✅ Regenerate answer (refresh AI answer; optionally reset chat)
app.post("/api/guides/:id/regenerate", async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) return res.status(404).json({ error: "Guide not found." });

    const prompt = buildGuidePrompt({
      make: guide.vehicle.make,
      model: guide.vehicle.model,
      year: guide.vehicle.year,
      question: guide.question,
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const newAnswer = (response.output_text || "").trim() || guide.aiAnswer;

    guide.aiAnswer = newAnswer;

    // reset chat so follow-ups match the new answer
    guide.chat = [
      {
        role: "assistant",
        text: "New guide generated. Ask follow-up questions about this updated answer.",
      },
    ];

    await guide.save();

    res.json({ aiAnswer: guide.aiAnswer, chat: guide.chat });
  } catch (err) {
    console.error("POST /api/guides/:id/regenerate error:", err);
    res.status(500).json({ error: "Failed to regenerate guide." });
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
