export default function AgentTrace({ trace }) {
  if (!trace?.length) return null;

  return (
    <div className="mt-4 rounded-xl bg-zinc-900 p-4 border border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agent Trace</h3>
        <span className="text-xs text-zinc-400">{trace.length} steps</span>
      </div>

      <div className="mt-3 space-y-2">
        {trace.map((t, i) => (
          <div key={i} className="rounded-lg bg-zinc-950 border border-zinc-800 p-3">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">{t.tool}</div>
              <div className="text-xs text-zinc-400">
                {typeof t.ms === "number" ? `${t.ms}ms` : ""}
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              {t.skipped ? "Skipped (no location)" : null}
              {typeof t.results === "number" ? `Results: ${t.results}` : null}
              {typeof t.ok === "boolean" ? ` • ok: ${String(t.ok)}` : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}