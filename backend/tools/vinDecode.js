// If Node <18, install node-fetch and add:
// import fetch from "node-fetch";

export async function decodeVIN(vin) {
  const clean = (vin || "").trim();
  if (clean.length < 11) return { ok: false, error: "VIN looks too short" };

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(
    clean
  )}?format=json`;

  const resp = await fetch(url);
  if (!resp.ok) return { ok: false, error: "VIN decode failed" };

  const data = await resp.json();
  const map = {};
  for (const row of data.Results || []) map[row.Variable] = row.Value;

  return {
    ok: true,
    vin: clean,
    year: map["Model Year"] || "",
    make: map["Make"] || "",
    model: map["Model"] || "",
    trim: map["Trim"] || "",
    engine: map["Engine Model"] || map["Engine Number of Cylinders"] || "",
  };
}