interface InfoPanelProps {
  label: string | null;
  content: string | null;
  hint?: string;
}

/**
 * Fixed detail panel anchored to the bottom of a diagram. Click-driven
 * (not hover) so the explanation stays put and is reachable on touch.
 */
export function InfoPanel({ label, content, hint = "Click a node for details." }: InfoPanelProps) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 14px",
        background: "var(--diagram-surface)",
        border: "1px solid var(--diagram-border)",
        borderRadius: "var(--radius-sm)",
        minHeight: 20,
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.5,
        color: "var(--diagram-text)",
      }}
    >
      {label ? (
        <>
          <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>{label}: </span>
          {content}
        </>
      ) : (
        <span style={{ color: "var(--diagram-text-muted)", fontStyle: "italic" }}>{hint}</span>
      )}
    </div>
  );
}
