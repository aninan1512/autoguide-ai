import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";

export default function ChatBox({ guideId, initialMessages }) {
  const seeded = useMemo(() => {
    if (initialMessages && initialMessages.length) return initialMessages;
    return [{ role: "assistant", text: "Ask anything about the guide above (tools, steps, safety, parts, etc.)." }];
  }, [initialMessages]);

  const [messages, setMessages] = useState(seeded);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => setMessages(seeded), [seeded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    setErr("");
    const msg = input.trim();
    if (!msg || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");

    try {
      setSending(true);
      const { data } = await api.post("/api/chat", { guideId, message: msg });

      if (data?.chat?.length) {
        setMessages(data.chat.map((m) => ({ role: m.role, text: m.text })));
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      }
    } catch (e) {
      console.error(e);
      setErr("Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="h-[360px] overflow-y-auto rounded-2xl border bg-gray-50 p-3 space-y-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border p-3 ${
              m.role === "user" ? "bg-white" : "bg-gray-100"
            }`}
          >
            <div className="text-xs text-gray-500 mb-1">
              {m.role === "user" ? "You" : "AutoGuide AI"}
            </div>
            <div className="whitespace-pre-wrap text-sm text-gray-900">{m.text}</div>
          </div>
        ))}

        {sending ? <div className="text-xs text-gray-500">Typing...</div> : null}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <button
          onClick={send}
          disabled={sending}
          className="rounded-xl bg-black px-4 py-2 text-white font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <p className="text-xs text-gray-500">
        Tip: Ask “What does torque spec mean?” or “Which tools are essential?”
      </p>
    </div>
  );
}


