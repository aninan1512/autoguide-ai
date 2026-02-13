import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import RecentSearches from "../components/RecentSearches";

export default function Dashboard() {
  const navigate = useNavigate();

  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [question, setQuestion] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadRecent() {
    try {
      setLoadingRecent(true);
      const { data } = await api.get("/api/searches?limit=12");
      setRecent(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecent(false);
    }
  }

  useEffect(() => {
    loadRecent();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!make || !model || !year || !question) {
      setError("Please fill in make, model, year, and your question.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post("/api/guides", {
        make,
        model,
        year,
        question,
      });

      // Go to results page
      navigate(`/guide/${data.id}`);
    } catch (e) {
      console.error(e);
      setError("Failed to generate guide. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 340,
          borderRight: "1px solid #e6e6e6",
          padding: 16,
          background: "#fafafa",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Recent Searches</h2>
        <RecentSearches
          items={recent}
          loading={loadingRecent}
          onOpen={(id) => navigate(`/guide/${id}`)}
          onRefresh={loadRecent}
        />
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>AutoGuide AI 🚗🤖</h1>
        <p style={{ maxWidth: 760 }}>
          Enter your vehicle details and ask a maintenance question. You’ll get a
          structured, step-by-step guide with tools, parts, safety warnings, and
          best practices.
        </p>

        <div
          style={{
            maxWidth: 760,
            border: "1px solid #e6e6e6",
            borderRadius: 12,
            padding: 16,
            background: "white",
          }}
        >
          <h3 style={{ marginTop: 0 }}>New Question</h3>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <input
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Make (e.g., Ford)"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model (e.g., Focus)"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Year (e.g., 2016)"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </div>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question (e.g., How do I change my brake pads?)"
              rows={4}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />

            {error ? (
              <div style={{ color: "crimson", fontSize: 14 }}>{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #111",
                background: submitting ? "#eee" : "#111",
                color: submitting ? "#333" : "white",
                cursor: submitting ? "not-allowed" : "pointer",
                width: 180,
              }}
            >
              {submitting ? "Generating..." : "Generate Guide"}
            </button>
          </form>

          <p style={{ marginTop: 14, color: "#666", fontSize: 13 }}>
            ⚠️ Educational use only. Always follow your owner’s manual and safety procedures.
          </p>
        </div>
      </div>
    </div>
  );
}
