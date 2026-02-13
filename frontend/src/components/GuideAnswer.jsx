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
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
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
    tab === "summary"
      ? sections.summary
      : tab === "steps"
      ? sections.steps
      : tab === "tools"
      ? sections.tools
      : tab === "parts"
      ? sections.parts
      : tab === "safety"
      ? sections.safety
      : sections.full;

  async function handleCopy(label, content) {
    const finalText = (content || "").trim();
    if (!finalText) {
      setCopiedMsg("Nothing to copy.");
      setTimeout(() => setCopiedMsg(""), 1200);
      return;
    }
    const ok = await copyToClipboard(finalText);
    setCopiedMsg(ok ? `Copied ${label}!` : "Copy failed. Try again.");
    setTimeout(() => setCopiedMsg(""), 1400);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Maintenance Guide</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy("section", shown)}
            className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            title="Copy the selected section"
          >
            Copy Section
          </button>

          {tab === "steps" ? (
            <button
              onClick={() => handleCopy("steps", sections.steps)}
              className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
              title="Copy steps only"
            >
              Copy Steps
            </button>
          ) : null}

          {copiedMsg ? <span className="text-sm text-gray-600">{copiedMsg}</span> : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              tab === t.key ? "bg-black text-white border-black" : "hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
        {shown || "No content available for this section."}
      </div>

      {tab !== "full" ? (
        <p className="mt-4 text-xs text-gray-500">
          Want everything? Open the <span className="font-semibold">Full</span> tab.
        </p>
      ) : null}
    </div>
  );
}


