export default function RecentSearches({ items, loading, onOpen, onRefresh }) {
  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <button
        onClick={onRefresh}
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "white",
          cursor: "pointer",
        }}
      >
        Refresh
      </button>

      {items?.length ? (
        items.map((s) => {
          const title = `${s.vehicle.year} ${s.vehicle.make} ${s.vehicle.model}`;
          return (
            <button
              key={s._id}
              onClick={() => onOpen(s._id)}
              style={{
                textAlign: "left",
                padding: 10,
                borderRadius: 12,
                border: "1px solid #e6e6e6",
                background: "white",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#444", marginTop: 6 }}>
                {s.question}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                {new Date(s.createdAt).toLocaleString()}
              </div>
            </button>
          );
        })
      ) : (
        <div style={{ color: "#666", fontSize: 13 }}>
          No searches yet. Ask your first question!
        </div>
      )}
    </div>
  );
}
