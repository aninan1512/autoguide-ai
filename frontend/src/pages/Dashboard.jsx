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
      navigate(`/guide/${data.id}`);
    } catch (e) {
      console.error(e);
      setError("Failed to generate guide. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="rounded-2xl border bg-white shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Recent Searches</h2>
              <p className="text-sm text-gray-500 mt-1">
                Click any item to reopen the guide.
              </p>
            </div>
            <div className="p-4">
              <RecentSearches
                items={recent}
                loading={loadingRecent}
                onOpen={(id) => navigate(`/guide/${id}`)}
                onRefresh={loadRecent}
              />
            </div>
          </aside>

          {/* Main */}
          <main className="space-y-6">
            <header className="rounded-2xl border bg-white shadow-sm p-6">
              <h1 className="text-2xl font-bold">AutoGuide AI 🚗🤖</h1>
              <p className="text-gray-600 mt-2 max-w-3xl">
                Enter your vehicle details and ask a maintenance question. You’ll get a structured,
                step-by-step guide with tools, parts, safety warnings, and best practices.
              </p>
            </header>

            <section className="rounded-2xl border bg-white shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h3 className="text-lg font-semibold">New Question</h3>
                <span className="text-xs text-gray-500">
                  Educational use only — verify with your owner’s manual/mechanic.
                </span>
              </div>

              <form onSubmit={onSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Make (e.g., Ford)"
                    className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Model (e.g., Focus)"
                    className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Year (e.g., 2018)"
                    className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question (e.g., How do I change my brake pads?)"
                  rows={4}
                  className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
                />

                {error ? (
                  <div className="text-sm text-red-600">{error}</div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-white font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Generating..." : "Generate Guide"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border bg-white shadow-sm p-6">
              <h4 className="font-semibold">Try these prompts</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "How to change engine oil?",
                  "Brake pads replacement steps",
                  "How to check coolant level?",
                  "What tools do I need to change a battery?",
                ].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQuestion(t)}
                    className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
