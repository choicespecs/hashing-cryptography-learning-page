import type { DiagramState } from "./Node";

const STATE_COLOR: Record<DiagramState, string> = {
  neutral: "var(--diagram-text)",
  healthy: "var(--diagram-state-healthy)",
  warning: "var(--diagram-state-warning)",
};

export interface TimelineEvent {
  /** Position along the axis, 0 (start) to 1 (end). */
  t: number;
  label: string;
  state?: DiagramState;
}

interface TimelineProps {
  width: number;
  y: number;
  events: TimelineEvent[];
  axisLabel?: string;
}

export function Timeline({ width, y, events, axisLabel }: TimelineProps) {
  return (
    <g transform={`translate(0, ${y})`}>
      <line x1={0} y1={0} x2={width} y2={0} stroke="var(--diagram-border)" strokeWidth={1} />
      {events.map((ev, i) => {
        const x = ev.t * width;
        const color = STATE_COLOR[ev.state ?? "neutral"];
        // Edge labels would otherwise center on x=0 or x=width and clip
        // outside the SVG — anchor them inward instead.
        const anchor = ev.t <= 0.03 ? "start" : ev.t >= 0.97 ? "end" : "middle";
        return (
          <g key={i} transform={`translate(${x}, 0)`}>
            <circle r={4} fill={color} />
            <text
              y={-10}
              textAnchor={anchor}
              fill={color}
              fontFamily="var(--font-mono)"
              fontSize="11"
            >
              {ev.label}
            </text>
          </g>
        );
      })}
      {axisLabel ? (
        <text
          x={width}
          y={22}
          textAnchor="end"
          fill="var(--diagram-text-muted)"
          fontFamily="var(--font-sans)"
          fontSize="11"
        >
          {axisLabel}
        </text>
      ) : null}
    </g>
  );
}
