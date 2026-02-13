import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import GuideAnswer from "../components/GuideAnswer";
import ChatBox from "../components/ChatBox";

export default function Guide() {
  const { id } = useParams();

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  async function loadGuide() {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/guides/${id}`);
      setGuide(data);
    } catch (e) {
      console.error(e);
      setErr("Could not load this guide. It may not exist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGuide();
  }, [id]);

  async function regenerate() {
    try {
      setRegenLoading(true);
      const { data } = await api.post(`/api/guides/${id}/regenerate`);
      setGuide((prev) => ({
        ...prev,
        aiAnswer: data.aiAnswer,
        chat: data.chat,
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate. Please try again.");
    } finally {
      setRegenLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading guide...</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!guide) return null;

  const title = `${guide.vehicle.year} ${guide.vehicle.make} ${guide.vehicle.model}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="rounded-2xl border bg-white shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="mt-2 text-gray-700">
                <span className="font-semibold">Question:</span> {guide.question}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={regenerate}
                disabled={regenLoading}
                className="rounded-xl bg-black px-4 py-2 text-white font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {regenLoading ? "Regenerating..." : "Regenerate Answer"}
              </button>

              <Link to="/" className="text-sm font-medium text-blue-600 hover:underline">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-6">
          <section className="rounded-2xl border bg-white shadow-sm p-6">
            <GuideAnswer text={guide.aiAnswer} />
            <p className="mt-4 text-xs text-gray-500">
              ⚠️ Educational use only. Always confirm with your owner’s manual or a certified mechanic.
            </p>
          </section>

          <aside className="rounded-2xl border bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold">Ask a follow-up</h3>
            <p className="text-sm text-gray-500 mt-1">
              Clarify steps, tools, parts, safety, or anything unclear.
            </p>
            <div className="mt-4">
              <ChatBox guideId={id} initialMessages={guide.chat || []} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

