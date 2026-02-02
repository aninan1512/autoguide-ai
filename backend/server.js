import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { getDb } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/", (req, res) => {
  res.send("AutoGuide AI backend is running. Try GET /health or POST /api/ask");
});

app.get("/health", async (req, res) => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.json({ ok: true, message: "API + MongoDB connected" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Recent searches (latest first)
app.get("/api/recent", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "8", 10), 25);

    const db = await getDb();
    const recent = await db
      .collection("queries")
      .find({}, { projection: { question: 1, vehicle: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({ ok: true, recent });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function validateResult(obj, fallbackTitle) {
  const clean = {
    title: typeof obj?.title === "string" ? obj.title : `Guide: ${fallbackTitle}`,
    vehicle: obj?.vehicle ?? null,
    difficulty: typeof obj?.difficulty === "string" ? obj.difficulty : "Medium",
    warnings: Array.isArray(obj?.warnings) ? obj.warnings : [],
    tools: Array.isArray(obj?.tools) ? obj.tools : [],
    parts: Array.isArray(obj?.parts) ? obj.parts : [],
    steps: Array.isArray(obj?.steps) ? obj.steps : [],
    notes: Array.isArray(obj?.notes) ? obj.notes : [],
    sourcesUsed: Array.isArray(obj?.sourcesUsed) ? obj.sourcesUsed : [],
  };

  clean.steps = clean.steps.map((s, i) => ({
    step: typeof s?.step === "number" ? s.step : i + 1,
    text: typeof s?.text === "string" ? s.text : "",
    tips: Array.isArray(s?.tips) ? s.tips : [],
  }));

  clean.tools = clean.tools.map((t) => ({
    name: typeof t?.name === "string" ? t.name : "",
    notes: typeof t?.notes === "string" ? t.notes : "",
  }));

  clean.parts = clean.parts.map((p) => ({
    name: typeof p?.name === "string" ? p.name : "",
    qty: typeof p?.qty === "number" ? p.qty : 1,
    notes: typeof p?.notes === "string" ? p.notes : "",
  }));

  return clean;
}

// Ask endpoint (AI + Save to MongoDB)
app.post("/api/ask", async (req, res) => {
  try {
    const { question, vehicle } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ ok: false, error: "question is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Missing OPENAI_API_KEY in backend/.env",
      });
    }

    const vehicleText = vehicle
      ? `${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""}`.trim()
      : "Not specified";

    const systemPrompt = `
You are AutoGuide AI, an automotive maintenance assistant.
Return ONLY valid JSON (no markdown, no backticks). Follow this schema exactly:

{
  "title": string,
  "vehicle": { "make": string, "model": string, "year": number } | null,
  "difficulty": "Easy" | "Medium" | "Hard",
  "warnings": string[],
  "tools": [{ "name": string, "notes": string }],
  "parts": [{ "name": string, "qty": number, "notes": string }],
  "steps": [{ "step": number, "text": string, "tips": string[] }],
  "notes": string[],
  "sourcesUsed": []
}

Rules:
- Be practical and detailed. Provide a complete tool list and parts list.
- If the question is vague, assume a typical approach and mention what can vary by year/trim.
- Never invent exact torque specs or manufacturer-only data; say “check owner/service manual” if needed.
- Include safety warnings for risky tasks (lifting vehicle, brakes, fuel, electrical).
- Keep steps clear and in order.
    `.trim();

    const userPrompt = `
Question: ${question}
Vehicle: ${vehicleText}
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const parsed = safeJsonParse(raw);

    if (!parsed) {
      return res.status(500).json({
        ok: false,
        error: "AI returned an unexpected format. Try again.",
      });
    }

    const result = validateResult(parsed, question);

    // Save to MongoDB (recent searches)
    const db = await getDb();
    await db.collection("queries").insertOne({
      question,
      vehicle: vehicle || null,
      resultSummary: {
        title: result.title,
        difficulty: result.difficulty,
      },
      createdAt: new Date(),
    });

    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
