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

  if (loading) return <div style={{ padding: 24 }}>Loading guide...</div>;
  if (err) return <div style={{ padding: 24, color: "crimson" }}>{err}</div>;
  if (!guide) return null;

  const title = `${guide.vehicle.year} ${guide.vehicle.make} ${guide.vehicle.model}`;

  return (
    <div style={{ minHeight: "100vh", padding: 24, background: "#fafafa" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0 }}>{title}</h1>
            <p style={{ marginTop: 6, color: "#444" }}>
              <b>Question:</b> {guide.question}
            </p>
          </div>

          <div style={{ alignSelf: "flex-start" }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div
            style={{
              border: "1px solid #e6e6e6",
              borderRadius: 12,
              padding: 16,
              background: "white",
            }}
          >
            <GuideAnswer text={guide.aiAnswer} />
            <p style={{ marginTop: 14, color: "#666", fontSize: 13 }}>
              ⚠️ Educational use only. Always confirm with your owner’s manual or a certified mechanic.
            </p>
          </div>

          <div
            style={{
              border: "1px solid #e6e6e6",
              borderRadius: 12,
              padding: 16,
              background: "white",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Ask a follow-up</h3>
            <ChatBox guideId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
