import { useEffect, useState } from "react";
import {
  sha,
  toHex,
  toBase64Url,
  toBase62,
  inputStyle,
  labelStyle,
  outputStyle,
  captionStyle,
  type ShaAlgo,
} from "./lib/hash";

type Encoding = "hex" | "base64url" | "base62";

const ALGOS: { id: ShaAlgo; bytes: number }[] = [
  { id: "SHA-1", bytes: 20 },
  { id: "SHA-256", bytes: 32 },
  { id: "SHA-512", bytes: 64 },
];

const ENCODINGS: { id: Encoding; label: string }[] = [
  { id: "hex", label: "Hex (0-9a-f)" },
  { id: "base64url", label: "Base64url (A-Za-z0-9-_)" },
  { id: "base62", label: "Base62 (A-Za-z0-9)" },
];

const LIMIT = 40;

const DEFAULT_INPUT =
  "https://shop.example.com/search?category=outdoor-gear&subcategory=tents-and-shelters" +
  "&brand=northface,patagonia,rei-co-op,big-agnes,nemo&min_price=150&max_price=900" +
  "&capacity=2-person,3-person&season=3-season,4-season&weight_max_lbs=6&sort=rating_desc" +
  "&page=3&utm_source=newsletter&utm_medium=email&utm_campaign=fall_2026_camping_sale" +
  "&session_ref=8f2c1a9e-77b4-4d1e-9c3a-0b6f5e2d4a81";

/** P(at least one collision) among n random values of `bits` bits — the birthday bound. */
function collisionProbability(n: number, bits: number): number {
  const exponent = -(n * n) / Math.pow(2, bits + 1);
  return -Math.expm1(exponent);
}

function formatProbability(p: number): string {
  if (p >= 0.999) return "≈ 100%";
  if (p >= 0.01) return `${(p * 100).toFixed(1)}%`;
  if (p === 0) return "< 1e-300";
  return p.toExponential(1);
}

export default function StringShortenerDiagram() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [algo, setAlgo] = useState<ShaAlgo>("SHA-256");
  const [encoding, setEncoding] = useState<Encoding>("base64url");
  const [keepBytes, setKeepBytes] = useState(16);
  const [digest, setDigest] = useState<Uint8Array | null>(null);

  const fullBytes = ALGOS.find((a) => a.id === algo)!.bytes;
  const kept = Math.min(keepBytes, fullBytes);

  useEffect(() => {
    let cancelled = false;
    sha(algo, input).then((d) => {
      if (!cancelled) setDigest(d);
    });
    return () => {
      cancelled = true;
    };
  }, [algo, input]);

  const truncated = digest ? digest.slice(0, kept) : null;
  const output = truncated
    ? encoding === "hex"
      ? toHex(truncated)
      : encoding === "base64url"
        ? toBase64Url(truncated)
        : toBase62(truncated)
    : "…";

  const bits = kept * 8;
  const fits = output.length < LIMIT;
  const barPct = Math.min(100, (output.length / 130) * 100);
  const limitPct = (LIMIT / 130) * 100;

  return (
    <div>
      <label style={{ ...labelStyle, marginTop: 0 }} htmlFor="shortener-input">
        Long input — {input.length} characters
      </label>
      <textarea
        id="shortener-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <p style={labelStyle}>Hash algorithm</p>
      <div className="diagram-toggle-group" role="tablist" aria-label="Hash algorithm">
        {ALGOS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={algo === a.id}
            className={`diagram-toggle${algo === a.id ? " diagram-toggle--active" : ""}`}
            onClick={() => {
              setAlgo(a.id);
              setKeepBytes((k) => Math.min(k, a.bytes));
            }}
          >
            {a.id} ({a.bytes * 8} bits)
          </button>
        ))}
      </div>

      <p style={labelStyle}>Encoding</p>
      <div className="diagram-toggle-group" role="tablist" aria-label="Output encoding">
        {ENCODINGS.map((e) => (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={encoding === e.id}
            className={`diagram-toggle${encoding === e.id ? " diagram-toggle--active" : ""}`}
            onClick={() => setEncoding(e.id)}
          >
            {e.label}
          </button>
        ))}
      </div>

      <label style={labelStyle} htmlFor="shortener-bytes">
        Keep the first <strong style={{ color: "var(--diagram-text)" }}>{kept} bytes</strong> ({bits} bits)
        of the {fullBytes}-byte digest
      </label>
      <input
        id="shortener-bytes"
        type="range"
        min={4}
        max={fullBytes}
        value={kept}
        onChange={(e) => setKeepBytes(Number(e.target.value))}
      />

      <p style={labelStyle}>Output</p>
      <pre style={outputStyle}>{output}</pre>

      <svg viewBox="0 0 400 44" width="100%" role="img" aria-label={`Output is ${output.length} characters; limit is ${LIMIT}`} style={{ marginTop: 12 }}>
        <rect x={0} y={10} width={400} height={14} rx={7} fill="var(--diagram-surface)" stroke="var(--diagram-border)" />
        <rect
          x={0}
          y={10}
          width={(barPct / 100) * 400}
          height={14}
          rx={7}
          fill={fits ? "var(--diagram-state-healthy)" : "var(--diagram-state-warning)"}
        />
        <line x1={(limitPct / 100) * 400} y1={4} x2={(limitPct / 100) * 400} y2={30} stroke="var(--diagram-text)" strokeDasharray="3 3" />
        <text x={(limitPct / 100) * 400 + 4} y={40} fill="var(--diagram-text-muted)" fontFamily="var(--font-mono)" fontSize="10">
          {LIMIT}-char limit
        </text>
      </svg>

      <p style={captionStyle}>
        <strong style={{ color: fits ? "var(--diagram-state-healthy)" : "var(--diagram-state-warning)" }}>
          {input.length} → {output.length} characters
          {fits ? " — fits under 40" : " — too long for a 40-char limit"}
        </strong>
        . Chance of <em>any</em> collision among 1 million inputs:{" "}
        <strong style={{ color: "var(--diagram-text)" }}>{formatProbability(collisionProbability(1e6, bits))}</strong>; among 1
        billion: <strong style={{ color: "var(--diagram-text)" }}>{formatProbability(collisionProbability(1e9, bits))}</strong>.
      </p>
    </div>
  );
}
