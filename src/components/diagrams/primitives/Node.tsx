import type { MouseEvent } from "react";

export type DiagramState = "neutral" | "healthy" | "warning";

const STATE_COLOR: Record<DiagramState, string> = {
  neutral: "var(--diagram-text)",
  healthy: "var(--diagram-state-healthy)",
  warning: "var(--diagram-state-warning)",
};

interface NodeProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  sublabel?: string;
  state?: DiagramState;
  onMouseEnter?: (e: MouseEvent<SVGGElement>) => void;
  onMouseLeave?: () => void;
  onClick?: (e: MouseEvent<SVGGElement>) => void;
}

export function Node({
  x,
  y,
  width = 120,
  height = 48,
  label,
  sublabel,
  state = "neutral",
  onMouseEnter,
  onMouseLeave,
  onClick,
}: NodeProps) {
  const color = STATE_COLOR[state];

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{ cursor: onClick || onMouseEnter ? "pointer" : "default" }}
    >
      <rect
        width={width}
        height={height}
        rx={8}
        fill="var(--diagram-surface)"
        stroke={color}
        strokeWidth={1.5}
      />
      <text
        x={width / 2}
        y={sublabel ? height / 2 - 5 : height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--diagram-text)"
        fontFamily="var(--font-mono)"
        fontSize="13"
      >
        {label}
      </text>
      {sublabel ? (
        <text
          x={width / 2}
          y={height / 2 + 13}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--diagram-text-muted)"
          fontFamily="var(--font-mono)"
          fontSize="11"
        >
          {sublabel}
        </text>
      ) : null}
    </g>
  );
}
