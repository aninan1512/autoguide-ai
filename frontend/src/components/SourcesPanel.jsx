export default function SourcesPanel({ citations }) {
  if (!citations?.length) return null;

  return (
    <div className="mt-4 rounded-xl bg-zinc-900 p-4 border border-zinc-800">
      <h3 className="text-lg font-semibold">Sources (RAG Citations)</h3>
      <div className="mt-3 space-y-3">
        {citations.map((c) => (
          <div key={c.id} className="rounded-lg bg-zinc-950 border border-zinc-800 p-3">
            <div className="text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">{c.source}</span>
              {" • "}score: {c.score}
              {" • "}chunk: {c.meta?.chunkIndex ?? "?"}
            </div>
            <p className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap">
              {c.snippet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}