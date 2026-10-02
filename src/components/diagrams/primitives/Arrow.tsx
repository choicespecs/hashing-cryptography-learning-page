import type { DiagramState } from "./Node";

const STATE_COLOR: Record<DiagramState, string> = {
  neutral: "var(--diagram-text-muted)",
  healthy: "var(--diagram-state-healthy)",
  warning: "var(--diagram-state-warning)",
};

interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  state?: DiagramState;
  dashed?: boolean;
}

export function Arrow({ x1, y1, x2, y2, label, state = "neutral", dashed = false }: ArrowProps) {
  const color = STATE_COLOR[state];
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = 8;
  const headAngle = Math.PI / 7;

  const p1 = {
    x: x2 - headLength * Math.cos(angle - headAngle),
    y: y2 - headLength * Math.sin(angle - headAngle),
  };
  const p2 = {
    x: x2 - headLength * Math.cos(angle + headAngle),
    y: y2 - headLength * Math.sin(angle + headAngle),
  };

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "4 4" : undefined}
      />
      <polygon points={`${x2},${y2} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill={color} />
      {label ? (
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          fill={color}
          fontFamily="var(--font-mono)"
          fontSize="11"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
