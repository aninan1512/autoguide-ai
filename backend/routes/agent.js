import express from "express";
import { z } from "zod";

import openai from "../utils/openaiClient.js";
import { retrieveDocs } from "../tools/retrieveDocs.js";
import shopsGoogle from "../tools/shopsGoogle.js";
import purchaseLinks from "../tools/purchaseLinks.js";
import { decodeVIN } from "../tools/vinDecode.js";

const router = express.Router();

const RunSchema = z.object({
  vehicle: z
    .object({
      year: z.string().optional(),
      make: z.string().optional(),
      model: z.string().optional(),
      vin: z.string().optional(),
    })
    .optional(),
  problem: z.string().min(3),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

const nowMs = () => Date.now();

router.post("/run", async (req, res) => {
  const parsed = RunSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { vehicle = {}, problem, location } = parsed.data;
  const trace = [];
  const citations = [];
  let vinData = null;

  try {
    // VIN decode
    if (vehicle.vin) {
      const t0 = nowMs();
      vinData = await decodeVIN(vehicle.vin);
      trace.push({ tool: "decodeVIN", ms: nowMs() - t0, ok: vinData.ok });
    }

    const finalVehicle = {
      year: vehicle.year || (vinData?.ok ? vinData.year : ""),
      make: vehicle.make || (vinData?.ok ? vinData.make : ""),
      model: vehicle.model || (vinData?.ok ? vinData.model : ""),
      vin: vehicle.vin || "",
    };

    // RAG retrieve
    const t1 = nowMs();
    const retrieved = await retrieveDocs(
      `${finalVehicle.year} ${finalVehicle.make} ${finalVehicle.model} - ${problem}`.trim(),
      4
    );
    trace.push({ tool: "retrieveDocs", ms: nowMs() - t1, results: retrieved.length });
    citations.push(...retrieved);

    // Shops
    let shops = [];
    if (location?.lat && location?.lng) {
      const t2 = nowMs();
      shops = await shopsGoogle({ query: problem, location });
      trace.push({ tool: "shopsGoogle", ms: nowMs() - t2, results: shops.length });
    } else {
      trace.push({ tool: "shopsGoogle", ms: 0, results: 0, skipped: true });
    }

    // Purchase links
    const t3 = nowMs();
    const links = purchaseLinks(problem);
    trace.push({ tool: "purchaseLinks", ms: nowMs() - t3 });

    // OpenAI response (JSON)
    const system = `
You are AutoGuide AI, an automotive troubleshooting + maintenance assistant.
Return VALID JSON ONLY (no markdown).
Be safety-first. If risk is high, recommend a professional mechanic.
Use citations if provided; otherwise respond with general best practices.
`;

    const userPayload = {
      vehicle: finalVehicle,
      problem,
      citations,
      output_format: {
        summary: "string",
        safety: ["string"],
        likely_causes: [{ cause: "string", confidence: 0.0 }],
        tools_needed: ["string"],
        parts_to_consider: ["string"],
        diagnostic_steps: ["string"],
        repair_steps: ["string"],
        when_to_visit_mechanic: ["string"],
        questions_to_ask_mechanic: ["string"],
      },
    };

    const t4 = nowMs();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      response_format: { type: "json_object" },
    });
    trace.push({ tool: "openai_generate", ms: nowMs() - t4 });

    const raw = completion.choices[0]?.message?.content || "{}";
    let guide;
    try {
      guide = JSON.parse(raw);
    } catch {
      guide = { summary: "Failed to parse model output", raw };
    }

    const shopsWithWhy = shops.map((s) => ({
      ...s,
      why: [
        s.openNow ? "Open now" : null,
        s.rating ? `${s.rating}★` : null,
        s.distanceKm != null ? `${s.distanceKm} km away` : null,
      ].filter(Boolean).join(" • "),
    }));

    return res.json({
      ok: true,
      vehicle: finalVehicle,
      vinDecoded: vinData?.ok ? vinData : null,
      guide,
      shops: shopsWithWhy,
      purchaseLinks: links,
      citations,
      trace,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Agent failed" });
  }
});

export default router;