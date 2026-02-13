import dotenv from "dotenv";
import { getDb } from "../db.js";

dotenv.config();

const SERVICE_PARTS = [
  {
    service: "oil_change",
    parts: [
      {
        name: "Engine oil",
        qty: 1,
        notes:
          "Choose the correct viscosity + spec for your engine (varies by year/engine). Check owner’s manual for exact spec and quantity."
      },
      {
        name: "Oil filter",
        qty: 1,
        notes: "Match filter to your exact engine/year/trim. Cross-check by VIN when buying."
      },
      {
        name: "Drain plug washer / gasket (if applicable)",
        qty: 1,
        notes: "Recommended if your vehicle uses a crush washer; replace to reduce leak risk."
      }
    ],
    tools: [
      { name: "Socket + ratchet (drain plug)", notes: "Size varies by vehicle." },
      { name: "Oil filter wrench", notes: "Type depends on filter design and space." },
      { name: "Drain pan", notes: "At least 6–8L capacity (more for larger engines)." },
      { name: "Funnel", notes: "Helps avoid spills." },
      { name: "Jack + jack stands (optional)", notes: "Only if clearance is tight; use proper lift points." },
      { name: "Gloves + shop towels", notes: "Keep hands clean and wipe spills." }
    ]
  },
  {
    service: "battery_replacement",
    parts: [
      {
        name: "Replacement car battery",
        qty: 1,
        notes:
          "Match group size, CCA rating, and terminal orientation. Confirm fitment for your year/trim."
      },
      { name: "Anti-corrosion terminal spray (optional)", qty: 1, notes: "Helps reduce corrosion." }
    ],
    tools: [
      { name: "Socket + ratchet", notes: "Commonly 10mm for terminals (varies)." },
      { name: "Battery terminal puller (optional)", notes: "Helps if terminals are stuck." },
      { name: "Wire brush / terminal cleaner", notes: "Clean corrosion for good contact." },
      { name: "Gloves + safety glasses", notes: "Battery safety." }
    ]
  },
  {
    service: "wiper_blades",
    parts: [
      { name: "Wiper blades", qty: 2, notes: "Confirm exact sizes for driver/passenger." },
      { name: "Rear wiper blade (if applicable)", qty: 1, notes: "Only for vehicles with rear wiper." }
    ],
    tools: [{ name: "None (usually)", notes: "Most blades are tool-free with a clip mechanism." }]
  },
  {
    service: "washer_fluid",
    parts: [{ name: "Windshield washer fluid", qty: 1, notes: "Choose seasonal fluid for winter climates." }],
    tools: [{ name: "Funnel (optional)", notes: "Helps avoid spills." }]
  },
  {
    service: "engine_air_filter",
    parts: [{ name: "Engine air filter", qty: 1, notes: "Confirm fitment for your year/engine." }],
    tools: [{ name: "Screwdriver / socket (sometimes)", notes: "Some housings use clips; others use screws." }]
  },
  {
    service: "cabin_air_filter",
    parts: [{ name: "Cabin air filter", qty: 1, notes: "Confirm fitment for your model/year." }],
    tools: [{ name: "Trim tool (optional)", notes: "Helps remove panels without damage." }]
  },
  {
    service: "tire_change",
    parts: [
      { name: "Spare tire or replacement wheel/tire", qty: 1, notes: "Ensure correct size and bolt pattern." }
    ],
    tools: [
      { name: "Jack", notes: "Use manufacturer-recommended jack points." },
      { name: "Jack stands (recommended)", notes: "For safety if doing more than a quick spare swap." },
      { name: "Lug wrench / breaker bar", notes: "For loosening lug nuts." },
      { name: "Torque wrench", notes: "Tighten to spec from owner manual." },
      { name: "Wheel chocks", notes: "Prevent vehicle movement." }
    ]
  }
];

async function main() {
  const db = await getDb();
  const col = db.collection("service_parts");

  // Upsert so you can run multiple times safely
  for (const doc of SERVICE_PARTS) {
    await col.updateOne(
      { service: doc.service },
      { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }

  console.log("✅ Seeded service_parts successfully.");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e.message);
  process.exit(1);
});
