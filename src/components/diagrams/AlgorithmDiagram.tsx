import { useState } from "react";
import { Node, type DiagramState } from "./primitives/Node";
import { InfoPanel } from "./primitives/InfoPanel";

interface Algo {
  name: string;
  sub: string;
  state: DiagramState;
  info: string;
}

const COLUMNS: { title: string; algos: Algo[] }[] = [
  {
    title: "Non-cryptographic (fast)",
    algos: [
      { name: "CRC32", sub: "32-bit", state: "neutral", info: "A checksum, not really a hash. Detects accidental corruption (network, disk, zip files). Trivial to forge on purpose. Too small to use as a unique ID." },
      { name: "MurmurHash3", sub: "32/128-bit", state: "neutral", info: "Fast, well-distributed. Used inside hash tables, Bloom filters, Cassandra/Kafka partitioners. Not safe against attacker-chosen inputs." },
      { name: "xxHash / XXH3", sub: "64/128-bit", state: "neutral", info: "Among the fastest hashes available — many GB/s. Great for checksums of large files, dedup, and cache keys when nobody is adversarial." },
    ],
  },
  {
    title: "Cryptographic — broken",
    algos: [
      { name: "MD5", sub: "128-bit", state: "warning", info: "Collisions can be generated in seconds on a laptop. Still fine as a non-adversarial fingerprint (e.g. cache key, ETag), never for signatures, certificates, or passwords." },
      { name: "SHA-1", sub: "160-bit", state: "warning", info: "Practical collision demonstrated in 2017 (SHAttered). Git historically used it and is migrating to SHA-256. Avoid in anything new." },
    ],
  },
  {
    title: "Cryptographic — use these",
    algos: [
      { name: "SHA-256", sub: "256-bit (SHA-2)", state: "healthy", info: "The default choice. Universally available (every language, database, and the browser's Web Crypto). Hardware-accelerated on modern CPUs." },
      { name: "SHA-512", sub: "512-bit (SHA-2)", state: "healthy", info: "Often faster than SHA-256 on 64-bit CPUs without SHA extensions. SHA-512/256 is a truncated variant that also resists length-extension." },
      { name: "SHA-3", sub: "224–512-bit", state: "healthy", info: "Different internal design (Keccak sponge) — a backup if SHA-2 is ever weakened. Immune to length-extension attacks. Less common in practice." },
      { name: "BLAKE2 / BLAKE3", sub: "variable", state: "healthy", info: "Faster than MD5 while being secure. Built-in configurable output length (great for shortening) and a keyed mode that replaces HMAC. In Python's hashlib." },
    ],
  },
  {
    title: "Password hashing (slow on purpose)",
    algos: [
      { name: "Argon2id", sub: "memory-hard", state: "healthy", info: "OWASP's first recommendation. Tunable time, memory, and parallelism — memory cost makes GPU/ASIC cracking expensive." },
      { name: "bcrypt", sub: "cost factor", state: "healthy", info: "Battle-tested since 1999, available everywhere. Note: silently truncates passwords at 72 bytes." },
      { name: "scrypt", sub: "memory-hard", state: "healthy", info: "Memory-hard like Argon2; used by some cryptocurrencies. A good choice when Argon2 isn't available." },
      { name: "PBKDF2", sub: "iterations", state: "neutral", info: "FIPS-approved, so required in some regulated environments. Not memory-hard — use a high iteration count (OWASP: 600,000 for PBKDF2-HMAC-SHA256)." },
    ],
  },
];

const COL_WIDTH = 170;
const COL_GAP = 16;
const NODE_H = 48;
const ROW_GAP = 12;

export default function AlgorithmDiagram() {
  const [selected, setSelected] = useState<Algo | null>(null);
  const maxRows = Math.max(...COLUMNS.map((c) => c.algos.length));
  const width = COLUMNS.length * COL_WIDTH + (COLUMNS.length - 1) * COL_GAP;
  const height = 40 + maxRows * (NODE_H + ROW_GAP);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Hash algorithm families">
        {COLUMNS.map((col, ci) => {
          const x = ci * (COL_WIDTH + COL_GAP);
          return (
            <g key={col.title}>
              <text
                x={x + COL_WIDTH / 2}
                y={20}
                textAnchor="middle"
                fill="var(--diagram-text-muted)"
                fontFamily="var(--font-sans)"
                fontSize="11"
                fontWeight={600}
              >
                {col.title}
              </text>
              {col.algos.map((a, ri) => (
                <Node
                  key={a.name}
                  x={x}
                  y={36 + ri * (NODE_H + ROW_GAP)}
                  width={COL_WIDTH}
                  height={NODE_H}
                  label={a.name}
                  sublabel={a.sub}
                  state={a.state}
                  onClick={() => setSelected(a)}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <InfoPanel label={selected?.name ?? null} content={selected?.info ?? null} hint="Click an algorithm for details." />
      <div className="diagram-legend">
        <span className="diagram-legend__item">
          <span className="diagram-legend__swatch" style={{ background: "var(--diagram-state-healthy)" }} />
          Recommended
        </span>
        <span className="diagram-legend__item">
          <span className="diagram-legend__swatch" style={{ background: "var(--diagram-state-warning)" }} />
          Broken for security
        </span>
        <span className="diagram-legend__item">
          <span className="diagram-legend__swatch" style={{ background: "var(--diagram-text)" }} />
          Fine for its niche
        </span>
      </div>
    </div>
  );
}
