import { useState } from "react";
import API from "../api/client";

/**
 * Safely render list items that might be:
 * - string
 * - number
 * - object (e.g. { cause, confidence })
 */
function renderItem(x) {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);

  if (typeof x === "object") {
    const cause = x.cause ?? x.title ?? x.name ?? x.step ?? x.text ?? "";
    const confidence =
      typeof x.confidence === "number"
        ? ` (${Math.round(x.confidence * 100)}%)`
        : "";
    const details = x.details ? ` — ${x.details}` : "";
    const fallback = cause || JSON.stringify(x);
    return `${fallback}${confidence}${details}`;
  }

  return String(x);
}

export default function Dashboard() {
  const [make, setMake] = useState("Ford");
  const [model, setModel] = useState("Expedition");
  const [year, setYear] = useState("2020");
  const [vin, setVin] = useState("");
  const [problem, setProblem] = useState("Headlight not turning on");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // ✅ Recent searches stored as structured objects
  // { id, vehicle: {year, make, model, vin}, problem, createdAt }
  const [recent, setRecent] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("autoguide_recent") || "[]");

      // Backward-compat: if old records used vehicle string, keep them but normalize
      return Array.isArray(raw)
        ? raw.map((r) => {
            if (r?.vehicle && typeof r.vehicle === "object") return r;

            // old format had vehicle: "2020 Ford Expedition"
            const vehicleStr = String(r?.vehicle || "").trim();
            const parts = vehicleStr.split(" ");
            const y = parts[0];
            const isYear = /^\d{4}$/.test(y);

            return {
              id: r?.id ?? Date.now(),
              vehicle: {
                year: isYear ? y : "",
                make: isYear ? parts[1] || "" : "",
                model: isYear ? parts.slice(2).join(" ") || "" : "",
                vin: "",
              },
              problem: r?.problem || "",
              createdAt: r?.createdAt || new Date().toISOString(),
            };
          })
        : [];
    } catch {
      return [];
    }
  });

  async function getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  function saveRecent(entry) {
    const next = [entry, ...recent].slice(0, 10);
    setRecent(next);
    localStorage.setItem("autoguide_recent", JSON.stringify(next));
  }

  const handleGenerate = async (override) => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const location = await getLocation();

      const payload = {
        vehicle: {
          year: override?.vehicle?.year ?? year,
          make: override?.vehicle?.make ?? make,
          model: override?.vehicle?.model ?? model,
          vin: override?.vehicle?.vin ?? vin,
        },
        problem: override?.problem ?? problem,
        location: location || undefined,
      };

      const res = await API.post("/agent/run", payload);

      const data = res.data || {};

      // Normalize top-level shapes (prevents white screen)
      const normalized = {
        ...data,
        shops: Array.isArray(data.shops) ? data.shops : [],
        citations: Array.isArray(data.citations) ? data.citations : [],
        trace: Array.isArray(data.trace) ? data.trace : [],
        purchaseLinks:
          data.purchaseLinks && typeof data.purchaseLinks === "object"
            ? data.purchaseLinks
            : {},
        guide: data.guide && typeof data.guide === "object" ? data.guide : {},
      };

      // Normalize guide arrays (prevents .map crashes)
      const g = normalized.guide || {};
      normalized.guide = {
        ...g,
        safety: Array.isArray(g.safety) ? g.safety : [],
        likely_causes: Array.isArray(g.likely_causes) ? g.likely_causes : [],
        tools_needed: Array.isArray(g.tools_needed) ? g.tools_needed : [],
        parts_to_consider: Array.isArray(g.parts_to_consider)
          ? g.parts_to_consider
          : [],
        diagnostic_steps: Array.isArray(g.diagnostic_steps)
          ? g.diagnostic_steps
          : [],
        repair_steps: Array.isArray(g.repair_steps) ? g.repair_steps : [],
        when_to_visit_mechanic: Array.isArray(g.when_to_visit_mechanic)
          ? g.when_to_visit_mechanic
          : [],
        questions_to_ask_mechanic: Array.isArray(g.questions_to_ask_mechanic)
          ? g.questions_to_ask_mechanic
          : [],
      };

      setResult(normalized);

      // ✅ Save structured recent entry
      saveRecent({
        id: Date.now(),
        vehicle: payload.vehicle,
        problem: payload.problem,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Generate failed:", err);
      setError(err?.response?.data?.error || "Failed to generate guide.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentIntoForm = (r) => {
    const v = r?.vehicle || {};
    if (v.year) setYear(String(v.year));
    if (v.make) setMake(String(v.make));
    if (v.model) setModel(String(v.model));
    setVin(String(v.vin || ""));
    setProblem(String(r.problem || ""));

    setError("");
    setResult(null);
  };

  const vehicleLabel = (v) =>
    `${v?.year || ""} ${v?.make || ""} ${v?.model || ""}`.replace(/\s+/g, " ").trim();

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">AutoGuide AI</h1>
            <p className="text-zinc-600">
              Generate vehicle-specific repair guidance with RAG + tools (shops + purchase links).
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Create guide */}
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Create a new guide</h2>
            <p className="text-zinc-600 mt-1">
              Enter your vehicle and ask a maintenance/repair question.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="rounded-xl border p-3"
                placeholder="Make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
              <input
                className="rounded-xl border p-3"
                placeholder="Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <input
                className="rounded-xl border p-3"
                placeholder="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <input
              className="mt-3 w-full rounded-xl border p-3"
              placeholder="VIN (optional)"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
            />

            <textarea
              className="mt-3 w-full rounded-xl border p-3 min-h-[120px]"
              placeholder="Describe the problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleGenerate()}
                disabled={loading || problem.trim().length < 3}
                className="rounded-xl bg-black text-white px-5 py-3 font-semibold disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Guide"}
              </button>

              <button
                onClick={() => {
                  setResult(null);
                  setError("");
                }}
                className="rounded-xl border px-5 py-3 font-semibold"
              >
                Clear
              </button>
            </div>

            <p className="text-xs text-zinc-500 mt-4">
              ⚠ Educational use only. Always confirm with your owner’s manual or a certified mechanic.
            </p>
          </div>

          {/* Right: Recent guides */}
          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent searches</h2>
              <button
                className="text-sm font-semibold text-zinc-700 underline"
                onClick={() => {
                  setRecent([]);
                  localStorage.removeItem("autoguide_recent");
                }}
              >
                Clear recent
              </button>
            </div>

            {recent.length === 0 ? (
              <p className="mt-4 text-zinc-600">
                No recent searches yet. Generate one on the left.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {recent.map((r) => (
                  <div key={r.id} className="rounded-xl border p-3">
                    <div className="font-semibold">
                      {vehicleLabel(r.vehicle)}
                    </div>
                    <div className="text-sm text-zinc-600 mt-1">
                      {r.problem}
                    </div>
                    <div className="text-xs text-zinc-400 mt-2">
                      {new Date(r.createdAt).toLocaleString()}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => loadRecentIntoForm(r)}
                        className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                      >
                        Load
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGenerate(r)} // ✅ run using that recent entry
                        className="rounded-lg bg-black text-white px-3 py-2 text-sm font-semibold hover:opacity-90"
                      >
                        Run
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Result panel */}
        {result && (
          <div className="mt-6 rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Generated Guide</h2>

            {/* Summary */}
            <div className="mt-4">
              <div className="text-sm text-zinc-500">Summary</div>
              <p className="mt-1 text-zinc-900">{result.guide?.summary}</p>
            </div>

            {/* Safety */}
            {result.guide?.safety?.length ? (
              <div className="mt-5">
                <div className="text-sm text-zinc-500">Safety</div>
                <ul className="mt-2 list-disc ml-6 space-y-1">
                  {result.guide.safety.map((s, i) => (
                    <li key={i}>{renderItem(s)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Likely causes */}
            {result.guide?.likely_causes?.length ? (
              <div className="mt-5">
                <div className="text-sm text-zinc-500">Likely causes</div>
                <ul className="mt-2 list-disc ml-6 space-y-1">
                  {result.guide.likely_causes.map((s, i) => (
                    <li key={i}>{renderItem(s)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Tools */}
            {result.guide?.tools_needed?.length ? (
              <div className="mt-5">
                <div className="text-sm text-zinc-500">Tools needed</div>
                <ul className="mt-2 list-disc ml-6 space-y-1">
                  {result.guide.tools_needed.map((s, i) => (
                    <li key={i}>{renderItem(s)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Parts */}
            {result.guide?.parts_to_consider?.length ? (
              <div className="mt-5">
                <div className="text-sm text-zinc-500">Parts to consider</div>
                <ul className="mt-2 list-disc ml-6 space-y-1">
                  {result.guide.parts_to_consider.map((s, i) => (
                    <li key={i}>{renderItem(s)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Diagnostics */}
            {result.guide?.diagnostic_steps?.length ? (
              <div className="mt-5">
                <div className="text-sm text-zinc-500">Diagnostic steps</div>
                <ol className="mt-2 list-decimal ml-6 space-y-1">
                  {result.guide.diagnostic_steps.map((s, i) => (
                    <li key={i}>{renderItem(s)}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* Repairs */}
            {result.guide?.repair_steps?.length ? (
              <div className="mt-5">
                <div className="text-sm text-zinc-500">Repair steps</div>
                <ol className="mt-2 list-decimal ml-6 space-y-1">
                  {result.guide.repair_steps.map((s, i) => (
                    <li key={i}>{renderItem(s)}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* Mechanic */}
            {result.guide?.when_to_visit_mechanic?.length ? (
              <div className="mt-5">
                <div className="text-sm text-zinc-500">When to visit a mechanic</div>
                <ul className="mt-2 list-disc ml-6 space-y-1">
                  {result.guide.when_to_visit_mechanic.map((s, i) => (
                    <li key={i}>{renderItem(s)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Questions */}
            {result.guide?.questions_to_ask_mechanic?.length ? (
              <div className="mt-5">
                <div className="text-sm text-zinc-500">Questions to ask a mechanic</div>
                <ul className="mt-2 list-disc ml-6 space-y-1">
                  {result.guide.questions_to_ask_mechanic.map((s, i) => (
                    <li key={i}>{renderItem(s)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Shops */}
            <div className="mt-6">
              <div className="text-sm text-zinc-500">Nearby shops</div>
              {result.shops.length ? (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.shops.map((s, i) => (
                    <a
                      key={i}
                      href={s.mapsUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border p-3 hover:bg-zinc-50"
                    >
                      <div className="font-semibold">{s.name || "Shop"}</div>
                      <div className="text-sm text-zinc-600 mt-1">
                        {(s.why || "").toString()} {s.address ? `• ${s.address}` : ""}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-zinc-600">
                  No shops returned. Allow location access to get nearby results.
                </p>
              )}
            </div>

            {/* Purchase links */}
            <div className="mt-6">
              <div className="text-sm text-zinc-500">Purchase links</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(result.purchaseLinks || {}).map(([k, url]) => (
                  <a
                    key={k}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold"
                  >
                    {k}
                  </a>
                ))}
              </div>
            </div>

            {/* Trace */}
            {result.trace.length ? (
              <div className="mt-6">
                <div className="text-sm text-zinc-500">Agent trace</div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.trace.map((t, i) => (
                    <div key={i} className="rounded-xl border p-3">
                      <div className="font-mono text-sm">{t.tool}</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {typeof t.ms === "number" ? `${t.ms}ms` : ""}
                        {typeof t.results === "number" ? ` • results: ${t.results}` : ""}
                        {t.skipped ? " • skipped" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Citations */}
            {result.citations.length ? (
              <div className="mt-6">
                <div className="text-sm text-zinc-500">Sources (RAG)</div>
                <div className="mt-2 space-y-3">
                  {result.citations.map((c, idx) => (
                    <div key={c.id || `${c.source}-${idx}`} className="rounded-xl border p-3">
                      <div className="text-xs text-zinc-500">
                        {c.source} • score: {c.score} • chunk: {c.meta?.chunkIndex}
                      </div>
                      <div className="mt-2 text-sm text-zinc-800 whitespace-pre-wrap">
                        {c.snippet}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}