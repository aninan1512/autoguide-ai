import { useState } from "react";
import API from "../api/client";
import AgentTrace from "../components/AgentTrace";
import SourcesPanel from "../components/SourcesPanel";

export default function Guide() {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [problem, setProblem] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  async function runAgent() {
    setError("");
    setData(null);
    setLoading(true);
    try {
      const location = await getLocation();
      const payload = {
        vehicle: { year, make, model, vin },
        problem,
        location: location || undefined,
      };
      const resp = await API.post("/agent/run", payload);
      setData(resp.data);
    } catch (e) {
      setError(e?.response?.data?.error || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const g = data?.guide;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h1 className="text-2xl font-bold">AutoGuide AI Agent</h1>
          <p className="text-sm text-zinc-300 mt-1">
            VIN decode + pgvector RAG + citations + shop finder + parts links + trace
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="bg-zinc-950 border border-zinc-800 rounded-xl p-3"
              placeholder="Year (optional)" value={year}
              onChange={(e) => setYear(e.target.value)} />
            <input className="bg-zinc-950 border border-zinc-800 rounded-xl p-3"
              placeholder="Make (optional)" value={make}
              onChange={(e) => setMake(e.target.value)} />
            <input className="bg-zinc-950 border border-zinc-800 rounded-xl p-3"
              placeholder="Model (optional)" value={model}
              onChange={(e) => setModel(e.target.value)} />
          </div>

          <div className="mt-3">
            <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3"
              placeholder="VIN (optional)" value={vin}
              onChange={(e) => setVin(e.target.value)} />
          </div>

          <div className="mt-3">
            <textarea className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 min-h-[110px]"
              placeholder="Describe the problem (e.g., headlight not turning on)"
              value={problem} onChange={(e) => setProblem(e.target.value)} />
          </div>

          <button
            onClick={runAgent}
            disabled={loading || problem.trim().length < 3}
            className="mt-4 w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-50"
          >
            {loading ? "Running agent..." : "Generate Guide"}
          </button>

          {error && <div className="mt-4 text-sm text-red-300">{error}</div>}

          <AgentTrace trace={data?.trace} />
          <SourcesPanel citations={data?.citations} />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-bold">Result</h2>

          {!data ? (
            <p className="text-zinc-300 mt-3">
              Run the agent to see a structured guide, nearby shops, and purchase links.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              {data?.vinDecoded && (
                <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                  <div className="text-sm text-zinc-300">VIN Decoded</div>
                  <div className="mt-1 font-semibold">
                    {data.vinDecoded.year} {data.vinDecoded.make} {data.vinDecoded.model}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    trim: {data.vinDecoded.trim || "—"} • engine: {data.vinDecoded.engine || "—"}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                <div className="text-lg font-semibold">Summary</div>
                <p className="mt-2 text-zinc-200 whitespace-pre-wrap">
                  {g?.summary || "No summary returned"}
                </p>
              </div>

              {g?.safety?.length ? (
                <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                  <div className="text-lg font-semibold">Safety</div>
                  <ul className="mt-2 list-disc ml-5 text-zinc-200">
                    {g.safety.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              ) : null}

              {g?.diagnostic_steps?.length ? (
                <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                  <div className="text-lg font-semibold">Diagnostics</div>
                  <ol className="mt-2 list-decimal ml-5 text-zinc-200">
                    {g.diagnostic_steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              ) : null}

              {g?.repair_steps?.length ? (
                <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                  <div className="text-lg font-semibold">Repair Steps</div>
                  <ol className="mt-2 list-decimal ml-5 text-zinc-200">
                    {g.repair_steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              ) : null}

              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                <div className="text-lg font-semibold">Nearby Shops</div>
                {data.shops?.length ? (
                  <div className="mt-3 space-y-3">
                    {data.shops.map((s, i) => (
                      <a key={i} href={s.mapsUrl || "#"} target="_blank" rel="noreferrer"
                        className="block rounded-lg border border-zinc-800 bg-zinc-900 p-3 hover:bg-zinc-800">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-zinc-300 mt-1">
                          {s.why || ""} • {s.address}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-300 mt-2">
                    No location (or no results). Allow location access to see nearby shops.
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                <div className="text-lg font-semibold">Buy Parts</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(data.purchaseLinks || {}).map(([k, url]) => (
                    <a key={k} href={url} target="_blank" rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-white text-black font-semibold text-sm">
                      {k}
                    </a>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}