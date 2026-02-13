export default function RecentSearches({ items, loading, onOpen, onRefresh }) {
  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={onRefresh}
        className="w-full rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Refresh
      </button>

      {items?.length ? (
        <div className="space-y-2">
          {items.map((s) => {
            const title = `${s.vehicle.year} ${s.vehicle.make} ${s.vehicle.model}`;
            return (
              <button
                key={s._id}
                onClick={() => onOpen(s._id)}
                className="w-full text-left rounded-2xl border p-3 hover:bg-gray-50"
              >
                <div className="font-semibold text-sm">{title}</div>
                <div className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {s.question}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(s.createdAt).toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500">No searches yet. Ask your first question!</div>
      )}
    </div>
  );
}
