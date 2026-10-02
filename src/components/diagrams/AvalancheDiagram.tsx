import { useEffect, useState } from "react";
import { sha, toHex, inputStyle, labelStyle, outputStyle, captionStyle } from "./lib/hash";

function popcount(n: number): number {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>= 1;
  }
  return c;
}

function HighlightedHex({ hex, other }: { hex: string; other: string }) {
  return (
    <pre style={outputStyle}>
      {hex.split("").map((ch, i) => (
        <span
          key={i}
          style={{ color: ch === other[i] ? "var(--diagram-text-muted)" : "var(--diagram-state-warning)" }}
        >
          {ch}
        </span>
      ))}
    </pre>
  );
}

export default function AvalancheDiagram() {
  const [a, setA] = useState("The quick brown fox jumps over the lazy dog");
  const [b, setB] = useState("The quick brown fox jumps over the lazy cog");
  const [hashes, setHashes] = useState<[Uint8Array, Uint8Array] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([sha("SHA-256", a), sha("SHA-256", b)]).then(([ha, hb]) => {
      if (!cancelled) setHashes([ha, hb]);
    });
    return () => {
      cancelled = true;
    };
  }, [a, b]);

  const hexA = hashes ? toHex(hashes[0]) : "";
  const hexB = hashes ? toHex(hashes[1]) : "";
  const bitsDiffer = hashes ? hashes[0].reduce((sum, byte, i) => sum + popcount(byte ^ hashes[1][i]), 0) : 0;
  const same = a === b;

  return (
    <div>
      <label style={{ ...labelStyle, marginTop: 0 }} htmlFor="avalanche-a">
        Input A
      </label>
      <input id="avalanche-a" style={inputStyle} value={a} onChange={(e) => setA(e.target.value)} />
      <p style={labelStyle}>SHA-256(A)</p>
      <HighlightedHex hex={hexA} other={hexB} />

      <label style={labelStyle} htmlFor="avalanche-b">
        Input B — try changing a single character
      </label>
      <input id="avalanche-b" style={inputStyle} value={b} onChange={(e) => setB(e.target.value)} />
      <p style={labelStyle}>SHA-256(B)</p>
      <HighlightedHex hex={hexB} other={hexA} />

      <p style={captionStyle}>
        {same ? (
          <>Identical inputs always produce the identical hash — that's <strong style={{ color: "var(--diagram-state-healthy)" }}>determinism</strong>.</>
        ) : (
          <>
            <strong style={{ color: "var(--diagram-state-warning)" }}>{bitsDiffer} of 256 bits</strong> differ (
            {((bitsDiffer / 256) * 100).toFixed(0)}%). A good hash flips about half the output bits for any change to the
            input — the <strong style={{ color: "var(--diagram-text)" }}>avalanche effect</strong> — so similar inputs give
            no hint of being similar.
          </>
        )}
      </p>
    </div>
  );
}
