import { useEffect, useState } from "react";
import { Node } from "./primitives/Node";
import { Arrow } from "./primitives/Arrow";
import { sha, toHex, captionStyle } from "./lib/hash";

const ORIGINAL = ["chunk 0: 'Hello, '", "chunk 1: 'world. '", "chunk 2: 'Hashes '", "chunk 3: 'all down.'"];
const TAMPERED = ["chunk 0: 'Hel1o, '", "chunk 1: 'w0rld. '", "chunk 2: 'Hashes!'", "chunk 3: 'all d0wn.'"];

interface Tree {
  leaves: string[];
  parents: string[];
  root: string;
}

async function buildTree(chunks: string[]): Promise<Tree> {
  const h = async (s: string) => toHex(await sha("SHA-256", s));
  const leaves = await Promise.all(chunks.map(h));
  const parents = await Promise.all([h(leaves[0] + leaves[1]), h(leaves[2] + leaves[3])]);
  const root = await h(parents[0] + parents[1]);
  return { leaves, parents, root };
}

const W = 140;
const H = 48;
const LEAF_X = [0, 160, 320, 480];
const PARENT_X = [80, 400];
const ROOT_X = 240;

export default function MerkleDiagram() {
  const [tampered, setTampered] = useState<boolean[]>([false, false, false, false]);
  const [tree, setTree] = useState<Tree | null>(null);
  const [originalRoot, setOriginalRoot] = useState<string>("");

  useEffect(() => {
    buildTree(ORIGINAL).then((t) => setOriginalRoot(t.root));
  }, []);

  useEffect(() => {
    let cancelled = false;
    buildTree(tampered.map((t, i) => (t ? TAMPERED[i] : ORIGINAL[i]))).then((t) => {
      if (!cancelled) setTree(t);
    });
    return () => {
      cancelled = true;
    };
  }, [tampered]);

  const short = (hex?: string) => (hex ? hex.slice(0, 10) + "…" : "…");
  const parentBad = [tampered[0] || tampered[1], tampered[2] || tampered[3]];
  const rootBad = parentBad[0] || parentBad[1];
  const count = tampered.filter(Boolean).length;

  return (
    <div>
      <svg viewBox="0 0 620 300" width="100%" role="img" aria-label="Merkle tree of four chunks">
        <Node x={ROOT_X} y={0} width={W} height={H} label={short(tree?.root)} sublabel="root hash" state={rootBad ? "warning" : "healthy"} />
        {PARENT_X.map((x, i) => (
          <g key={x}>
            <Arrow x1={x + W / 2} y1={100} x2={ROOT_X + W / 2} y2={H + 2} state={parentBad[i] ? "warning" : "neutral"} />
            <Node x={x} y={100} width={W} height={H} label={short(tree?.parents[i])} sublabel={`H(h${i * 2} + h${i * 2 + 1})`} state={parentBad[i] ? "warning" : "neutral"} />
          </g>
        ))}
        {LEAF_X.map((x, i) => (
          <g key={x}>
            <Arrow x1={x + W / 2} y1={200} x2={PARENT_X[Math.floor(i / 2)] + W / 2} y2={100 + H + 2} state={tampered[i] ? "warning" : "neutral"} />
            <Node
              x={x}
              y={200}
              width={W}
              height={H}
              label={short(tree?.leaves[i])}
              sublabel={`h${i} = H(chunk ${i})`}
              state={tampered[i] ? "warning" : "neutral"}
              onClick={() => setTampered((t) => t.map((v, j) => (j === i ? !v : v)))}
            />
            <text x={x + W / 2} y={272} textAnchor="middle" fill={tampered[i] ? "var(--diagram-state-warning)" : "var(--diagram-text-muted)"} fontFamily="var(--font-mono)" fontSize="10">
              {(tampered[i] ? TAMPERED[i] : ORIGINAL[i]).split(": ")[1]}
            </text>
            <text x={x + W / 2} y={290} textAnchor="middle" fill="var(--diagram-text-muted)" fontFamily="var(--font-sans)" fontSize="10">
              {tampered[i] ? "click to restore" : "click to tamper"}
            </text>
          </g>
        ))}
      </svg>
      <p style={captionStyle}>
        {count === 0 ? (
          <>
            Root matches the trusted value <code>{short(originalRoot)}</code>. Click a chunk to change one byte of it.
          </>
        ) : (
          <>
            <strong style={{ color: "var(--diagram-state-warning)" }}>Root no longer matches</strong> the trusted{" "}
            <code>{short(originalRoot)}</code>. Comparing just the two child hashes tells you which half changed; following
            the mismatches down finds the bad chunk{count > 1 ? "s" : ""} in log₂(n) steps instead of re-checking every chunk.
          </>
        )}
      </p>
    </div>
  );
}
