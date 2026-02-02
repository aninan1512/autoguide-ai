import { useEffect, useMemo, useState } from "react";

export default function App() {
  const [question, setQuestion] = useState("");
  const [vehicle, setVehicle] = useState({
    make: "Ford",
    model: "Focus",
    year: 2018,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const apiBase = "http://localhost:5000";

  const vehicleLabel = useMemo(() => {
    const { make, model, year } = vehicle;
    const parts = [year, make, model].filter(Boolean);
    return parts.join(" ");
  }, [vehicle]);

  async function loadRecent() {
    setRecentLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/recent?limit=8`);
      const data = await res.json();
      if (data.ok) setRecent(data.recent || []);
    } catch {
      // don't block UI if recent fails
    } finally {
      setRecentLoading(false);
    }
  }

  useEffect(() => {
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAsk() {
    setError("");
    setResult(null);

    if (!question.trim()) {
      setError("Please type a question first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, vehicle }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Request failed");
      setResult(data.result);

      // refresh recents after asking
      loadRecent();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.h1}>AutoGuide AI</h1>
          <p style={styles.sub}>
            Ask a car maintenance question and get tools, parts, and step-by-step instructions.
          </p>

          {/* Safety note */}
          <div style={styles.note}>
            ⚠️ Note: This guidance is AI-generated. Always confirm with your vehicle’s owner manual/service manual and use safe practices.
          </div>
        </header>

        {/* Ask card */}
        <section style={styles.card}>
          <label style={styles.label}>Vehicle</label>
          <div style={styles.grid3}>
            <input
              style={styles.input}
              value={vehicle.make}
              onChange={(e) => setVehicle((v) => ({ ...v, make: e.target.value }))}
              placeholder="Make (e.g., Ford)"
            />
            <input
              style={styles.input}
              value={vehicle.model}
              onChange={(e) => setVehicle((v) => ({ ...v, model: e.target.value }))}
              placeholder="Model (e.g., Focus)"
            />
            <input
              style={styles.input}
              value={vehicle.year}
              onChange={(e) =>
                setVehicle((v) => ({ ...v, year: e.target.value ? Number(e.target.value) : "" }))
              }
              placeholder="Year (e.g., 2018)"
              type="number"
            />
          </div>

          <label style={{ ...styles.label, marginTop: 16 }}>Your question</label>
          <input
            style={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g., "How to change washer fluid?"'
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAsk();
            }}
          />

          <div style={styles.actions}>
            <button
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
              onClick={handleAsk}
              disabled={loading}
            >
              {loading ? "Thinking..." : "Ask"}
            </button>

            <span style={styles.smallText}>
              Selected vehicle: <b>{vehicleLabel || "Not set"}</b>
            </span>
          </div>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}
        </section>

        {/* Recent Searches */}
        <section style={{ ...styles.card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Recent Searches</h3>
            <button
              onClick={loadRecent}
              style={{ ...styles.smallBtn, opacity: recentLoading ? 0.7 : 1 }}
              disabled={recentLoading}
            >
              {recentLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {recent.length === 0 ? (
            <p style={{ marginTop: 10, opacity: 0.7 }}>
              No searches yet. Ask something to get started.
            </p>
          ) : (
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {recent.map((r) => (
                <button
                  key={r._id}
                  onClick={() => {
                    setQuestion(r.question || "");

                    // OPTIONAL: if you want it to auto-run immediately, uncomment:
                    // setTimeout(() => handleAsk(), 0);
                  }}
                  style={styles.recentItem}
                  title="Click to reuse this question"
                >
                  <div style={{ fontWeight: 700, textAlign: "left" }}>
                    {r.question}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, textAlign: "left", marginTop: 4 }}>
                    {(r.vehicle?.year ? `${r.vehicle.year} ` : "") +
                      (r.vehicle?.make ? `${r.vehicle.make} ` : "") +
                      (r.vehicle?.model ? `${r.vehicle.model}` : "")}
                    {r.createdAt ? ` • ${new Date(r.createdAt).toLocaleString()}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Result */}
        {result && (
          <section style={styles.resultCard}>
            <h2 style={styles.h2}>{result.title}</h2>

            {result.vehicle && (
              <p style={styles.meta}>
                Vehicle:{" "}
                <b>
                  {result.vehicle.year} {result.vehicle.make} {result.vehicle.model}
                </b>
              </p>
            )}

            <Divider />

            <Section title="Safety Warnings">
              <BulletList items={result.warnings} />
            </Section>

            <Section title="Tools Needed">
              <ul style={styles.ul}>
                {(result.tools || []).map((t, idx) => (
                  <li key={idx} style={styles.li}>
                    <b>{t.name}</b>
                    {t.notes ? <span style={styles.muted}> — {t.notes}</span> : null}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Parts / Items to Buy">
              <ul style={styles.ul}>
                {(result.parts || []).map((p, idx) => (
                  <li key={idx} style={styles.li}>
                    <b>{p.name}</b>
                    {typeof p.qty !== "undefined" ? (
                      <span style={styles.muted}> (Qty: {p.qty})</span>
                    ) : null}
                    {p.notes ? <span style={styles.muted}> — {p.notes}</span> : null}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Step-by-step Instructions">
              <ol style={styles.ol}>
                {(result.steps || []).map((s) => (
                  <li key={s.step} style={styles.oli}>
                    <div style={styles.stepText}>{s.text}</div>
                    {s.tips?.length ? (
                      <ul style={{ ...styles.ul, marginTop: 6 }}>
                        {s.tips.map((tip, i) => (
                          <li key={i} style={styles.li}>
                            <span style={styles.muted}>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </Section>

            {result.notes?.length ? (
              <Section title="Notes">
                <BulletList items={result.notes} />
              </Section>
            ) : null}
          </section>
        )}

        <footer style={styles.footer}>
          <span style={styles.footerText}>
            Tip: Keep backend running in one terminal and frontend in another.
          </span>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={styles.h3}>{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }) {
  if (!items || !items.length) return <p style={styles.muted}>No items.</p>;
  return (
    <ul style={styles.ul}>
      {items.map((x, idx) => (
        <li key={idx} style={styles.li}>
          {x}
        </li>
      ))}
    </ul>
  );
}

function Divider() {
  return <div style={styles.divider} />;
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: 20,
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    color: "#1f2937",
  },
  header: {
    marginBottom: 16,
  },
  h1: { margin: 0, fontSize: 34 },
  sub: { marginTop: 8, marginBottom: 0, opacity: 0.8, lineHeight: 1.5 },

  note: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    lineHeight: 1.5,
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  label: { display: "block", fontWeight: 600, marginBottom: 6 },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  input: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
  },
  button: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  smallText: { fontSize: 13, opacity: 0.8 },
  errorBox: {
    marginTop: 12,
    padding: 12,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    borderRadius: 10,
    color: "#9f1239",
  },

  smallBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  recentItem: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
  },

  resultCard: {
    marginTop: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  h2: { margin: 0, fontSize: 24 },
  h3: { margin: "0 0 10px 0", fontSize: 18 },
  meta: { marginTop: 8, marginBottom: 0, opacity: 0.8 },
  divider: { height: 1, background: "#e5e7eb", marginTop: 14, marginBottom: 6 },
  ul: { marginTop: 0, marginBottom: 0, paddingLeft: 18, lineHeight: 1.6 },
  li: { marginBottom: 6 },
  ol: { marginTop: 0, paddingLeft: 18, lineHeight: 1.6 },
  oli: { marginBottom: 10 },
  stepText: { lineHeight: 1.6 },
  muted: { opacity: 0.8 },

  footer: { marginTop: 20, textAlign: "center" },
  footerText: { fontSize: 12, opacity: 0.7 },
};
