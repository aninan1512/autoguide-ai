import { useMemo, useState } from "react";

function extractSection(text, heading) {
  const start = text.indexOf(heading);
  if (start === -1) return "";

  const rest = text.slice(start + heading.length);
  const nextHeadingIdx = rest.indexOf("\n## ");
  const section = nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx);
  return section.trim();
}

async function copyToClipboard(content) {
  // Best-effort clipboard support
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    // Fallback: old execCommand approach
    try {
      const ta = document.createElement("textarea");
      ta.value = content;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export default function GuideAnswer({ text }) {
  const sections = useMemo(() => {
    const full = text?.trim() || "";
    return {
      summary: extractSection(full, "## Summary"),
      safety: extractSection(full, "## Safety Warnings"),
      tools: extractSection(full, "## Tools Needed"),
      parts: extractSection(full, "## Parts / Supplies"),
      steps: extractSection(full, "## Step-by-step Instructions"),
      mistakes: extractSection(full, "## Common Mistakes to Avoid"),
      time: extractSection(full, "## Estimated Time + Difficulty"),
      stop: extractSection(full, "## When to Stop and Call a Mechanic"),
      full,
    };
  }, [text]);

  const [tab, setTab] = useState("summary");
  const [copiedMsg, setCopiedMsg] = useState("");

  const tabs = [
    { key: "summary", label: "Summary" },
    { key: "steps", label: "Steps" },
    { key: "tools", label: "Tools" },
    { key: "parts", label: "Parts" },
    { key: "safety", label: "Safety" },
    { key: "full", label: "Full" },
  ];

  const shown =
    tab === "summary" ? sections.summary :
    tab === "steps" ? sections.steps :
    tab === "tools" ? sections.tools :
    tab === "parts" ? sections.parts :
    tab === "safety" ? sections.safety :
    sections.full;

  async function handleCopy(label, content) {
    const finalText = (content || "").trim();
    if (!finalText) {
      setCopiedMsg("Nothing to copy.");
      setTimeout(() => setCopiedMsg(""), 1200);
      return;
    }

    const ok = await copyToClipboard(finalText);
    setCopiedMsg(ok ? `Copied ${label}!` : "Copy failed. Please try again.");
    setTimeout(() => setCopiedMsg(""), 1400);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Maintenance Guide</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => handleCopy("section", shown)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
              fontSize: 13,
            }}
            title="Copy the currently selected section"
          >
            Copy Section
          </button>

          {tab === "steps" ? (
            <button
              onClick={() => handleCopy("steps", sections.steps)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "white",
                cursor: "pointer",
                fontSize: 13,
              }}
              title="Copy steps only"
            >
              Copy Steps
            </button>
          ) : null}

          {copiedMsg ? (
            <span style={{ fontSize: 13, color: "#444" }}>{copiedMsg}</span>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 12 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: tab === t.key ? "#111" : "white",
              color: tab === t.key ? "white" : "#111",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.55,
          color: "#111",
          fontSize: 14,
        }}
      >
        {shown || "No content available for this section."}
      </div>

      {tab !== "full" ? (
        <div style={{ marginTop: 14, color: "#666", fontSize: 12 }}>
          Want everything? Open the <b>Full</b> tab.
        </div>
      ) : (
        <div style={{ marginTop: 14, color: "#666", fontSize: 12 }}>
          Included sections: Summary, Safety, Tools, Parts, Steps, Mistakes, Time, When to stop.
        </div>
      )}
    </div>
  );
}

