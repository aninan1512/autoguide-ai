// backend/schemas/repairPlanSchema.js
export const RepairPlanSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    vehicle: {
      type: "object",
      additionalProperties: false,
      properties: {
        year: { type: "integer" },
        make: { type: "string" },
        model: { type: "string" },
        trim: { type: "string" },
        engine: { type: "string" },
      },
      required: ["year", "make", "model"],
    },
    issue_summary: { type: "string" },
    severity: { type: "string", enum: ["low", "medium", "high"] },
    diy_recommended: { type: "boolean" },
    safety_warnings: { type: "array", items: { type: "string" } },
    diagnostics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          check: { type: "string" },
          why: { type: "string" },
        },
        required: ["check", "why"],
      },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          step: { type: "integer" },
          instruction: { type: "string" },
          tips: { type: "array", items: { type: "string" } },
        },
        required: ["step", "instruction"],
      },
    },
    parts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          qty: { type: "number" },
          priority: { type: "string", enum: ["required", "recommended", "optional"] },
          notes: { type: "string" },
        },
        required: ["name", "qty", "priority"],
      },
    },
    tools: { type: "array", items: { type: "string" } },
    purchase_links: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          part_name: { type: "string" },
          links: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                label: { type: "string" },
                url: { type: "string" },
              },
              required: ["label", "url"],
            },
          },
        },
        required: ["part_name", "links"],
      },
    },
    nearby_shops: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          address: { type: "string" },
          phone: { type: "string" },
          rating: { type: "number" },
          user_ratings_total: { type: "integer" },
          open_now: { type: "boolean" },
          distance_m: { type: "number" },
          maps_url: { type: "string" },
        },
        required: ["name", "address"],
      },
    },
    follow_up_questions: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" },
  },
  required: ["vehicle", "issue_summary", "severity", "diy_recommended", "steps", "disclaimer"],
};