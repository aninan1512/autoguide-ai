import { useState } from "react";
import api from "../api/client";

export default function ChatBox({ guideId }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask anything about the guide above (tools, steps, safety, parts, etc.).",
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  async function send() {
    setErr("");
    const msg = input.trim();
    if (!msg) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");

    try {
      setSending(true);
      const { data } = await api.post("/api/chat", {
        guideId,
        message: msg,
      });

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (e) {
      console.error(e);
      setErr("Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div
        style={{
          height: 360,
          overflowY: "auto",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 10,
          background: "#fafafa",
          display: "grid",
          gap: 10,
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              padding: 10,
              borderRadius: 12,
              background: m.role === "user" ? "white" : "#f3f3f3",
              border: "1px solid #e9e9e9",
            }}
          >
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
              {m.role === "user" ? "You" : "AutoGuide AI"}
            </div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{m.text}</div>
          </div>
        ))}
        {sending ? (
          <div style={{ fontSize: 13, color: "#666" }}>Typing...</div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 12,
            border: "1px solid #ddd",
          }}
        />
        <button
          onClick={send}
          disabled={sending}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: sending ? "#eee" : "#111",
            color: sending ? "#333" : "white",
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>

      {err ? <div style={{ color: "crimson", marginTop: 8 }}>{err}</div> : null}

      <div style={{ color: "#777", fontSize: 12, marginTop: 10 }}>
        Tip: Ask “What does this step mean?” or “What tools do I need exactly?”
      </div>
    </div>
  );
}
