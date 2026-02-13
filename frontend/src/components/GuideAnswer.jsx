export default function GuideAnswer({ text }) {
  // Simple formatting: keep it readable as pre-wrapped text
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Maintenance Guide</h2>
      <div
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.55,
          color: "#111",
          fontSize: 14,
        }}
      >
        {text}
      </div>
    </div>
  );
}
