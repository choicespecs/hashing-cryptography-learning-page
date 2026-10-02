import { useState } from "react";
import { fnv1a32, captionStyle } from "./lib/hash";

type Mode = "modulo" | "ring";

const KEYS = Array.from({ length: 30 }, (_, i) => `user:${1000 + i * 37}`);
const VNODES = 40;
const SERVER_COLORS = ["#6fb98f", "#e2a857", "#7fa7d9", "#c98fc4", "#e07a6b"];
const MAX32 = 2 ** 32;

function moduloAssign(key: string, servers: number): number {
  return fnv1a32(key) % servers;
}

function ringPoints(servers: number): { pos: number; server: number }[] {
  const points: { pos: number; server: number }[] = [];
  for (let s = 0; s < servers; s++) {
    for (let v = 0; v < VNODES; v++) points.push({ pos: fnv1a32(`server-${s}#${v}`), server: s });
  }
  return points.sort((a, b) => a.pos - b.pos);
}

function ringAssign(key: string, points: { pos: number; server: number }[]): number {
  const h = fnv1a32(key);
  // First virtual node clockwise from the key, wrapping around to the start.
  const hit = points.find((p) => p.pos >= h) ?? points[0];
  return hit.server;
}

export default function ConsistentHashingDiagram() {
  const [mode, setMode] = useState<Mode>("modulo");
  const [servers, setServers] = useState(4);

  const assign = (n: number) => {
    if (mode === "modulo") return KEYS.map((k) => moduloAssign(k, n));
    const pts = ringPoints(n);
    return KEYS.map((k) => ringAssign(k, pts));
  };

  const before = assign(4);
  const now = assign(servers);
  const moved = now.filter((s, i) => s !== before[i]).length;

  const R = 90;
  const cx = 110;
  const cy = 110;
  const toXY = (pos: number, r: number) => {
    const angle = (pos / MAX32) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  return (
    <div>
      <div className="diagram-toggle-group" role="tablist" aria-label="Placement strategy">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "modulo"}
          className={`diagram-toggle${mode === "modulo" ? " diagram-toggle--active" : ""}`}
          onClick={() => setMode("modulo")}
        >
          hash(key) % N
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "ring"}
          className={`diagram-toggle${mode === "ring" ? " diagram-toggle--active" : ""}`}
          onClick={() => setMode("ring")}
        >
          Consistent hashing (ring)
        </button>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className={`diagram-toggle${servers === 5 ? " diagram-toggle--active" : ""}`}
          onClick={() => setServers((s) => (s === 4 ? 5 : 4))}
        >
          {servers === 4 ? "Add server #5" : "Remove server #5"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        {mode === "ring" ? (
          <svg viewBox="0 0 220 220" width={220} style={{ flexShrink: 0, maxWidth: "100%" }} role="img" aria-label="Hash ring">
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--diagram-border)" strokeWidth={2} />
            {ringPoints(servers).map((p, i) => {
              const { x, y } = toXY(p.pos, R);
              return <circle key={i} cx={x} cy={y} r={2.5} fill={SERVER_COLORS[p.server]} />;
            })}
            {KEYS.map((k, i) => {
              const { x, y } = toXY(fnv1a32(k), R - 14);
              return (
                <circle
                  key={k}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="none"
                  stroke={now[i] !== before[i] ? "var(--diagram-text)" : SERVER_COLORS[now[i]]}
                  strokeWidth={now[i] !== before[i] ? 2 : 1}
                />
              );
            })}
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--diagram-text-muted)" fontFamily="var(--font-sans)" fontSize="10">
              outer dots: {VNODES} vnodes/server
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle" fill="var(--diagram-text-muted)" fontFamily="var(--font-sans)" fontSize="10">
              inner rings: keys
            </text>
          </svg>
        ) : null}

        <div style={{ flex: 1, minWidth: 240, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {KEYS.map((k, i) => {
            const movedKey = now[i] !== before[i];
            return (
              <span
                key={k}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  padding: "3px 6px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--diagram-surface)",
                  border: `1.5px ${movedKey ? "dashed" : "solid"} ${SERVER_COLORS[now[i]]}`,
                  color: "var(--diagram-text)",
                }}
                title={movedKey ? `moved from server ${before[i] + 1}` : undefined}
              >
                {k} → S{now[i] + 1}
              </span>
            );
          })}
        </div>
      </div>

      <div className="diagram-legend" style={{ flexWrap: "wrap" }}>
        {SERVER_COLORS.slice(0, servers).map((c, i) => (
          <span key={c} className="diagram-legend__item">
            <span className="diagram-legend__swatch" style={{ background: c }} />
            Server {i + 1}
          </span>
        ))}
      </div>

      <p style={captionStyle}>
        {servers === 4 ? (
          <>Four servers. Click <em>Add server #5</em> to see how many keys have to move.</>
        ) : (
          <>
            Adding one server moved{" "}
            <strong style={{ color: mode === "modulo" ? "var(--diagram-state-warning)" : "var(--diagram-state-healthy)" }}>
              {moved} of {KEYS.length} keys ({Math.round((moved / KEYS.length) * 100)}%)
            </strong>{" "}
            (dashed outline).{" "}
            {mode === "modulo"
              ? "With modulo, almost every key's bucket changes — in a cache cluster, that's a near-total miss storm."
              : "On the ring, only keys that land in the new server's arcs move — ideally about 1/N of them."}
          </>
        )}
      </p>
    </div>
  );
}
