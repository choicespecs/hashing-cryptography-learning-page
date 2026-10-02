import { useEffect, useState } from "react";
import { sha, toHex, captionStyle } from "./lib/hash";

type Mode = "plain" | "salted";

const USERS = [
  { name: "alice", password: "hunter2" },
  { name: "bob", password: "correct horse battery staple" },
  { name: "carol", password: "hunter2" },
  { name: "dave", password: "password123" },
];

// What an attacker brings: hashes of common passwords, computed once, reused forever.
const COMMON = ["123456", "password", "password123", "hunter2", "qwerty", "letmein"];

// Fixed for reproducibility; real salts come from a CSPRNG, one per user.
const SALTS = ["k9Qz7wLr", "Xb3pT0aM", "e8Jd2nVs", "Ru5cY1hG"];

interface Row {
  name: string;
  salt: string | null;
  hash: string;
  cracked: string | null;
}

export default function SaltingDiagram() {
  const [mode, setMode] = useState<Mode>("plain");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const table = new Map<string, string>();
      for (const pw of COMMON) table.set(toHex(await sha("SHA-256", pw)), pw);

      const out: Row[] = [];
      for (let i = 0; i < USERS.length; i++) {
        const u = USERS[i];
        const salt = mode === "salted" ? SALTS[i] : null;
        const hash = toHex(await sha("SHA-256", (salt ?? "") + u.password));
        out.push({ name: u.name, salt, hash, cracked: table.get(hash) ?? null });
      }
      if (!cancelled) setRows(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const dupes = new Set(rows.filter((r, i) => rows.findIndex((o) => o.hash === r.hash) !== i).map((r) => r.hash));
  const crackedCount = rows.filter((r) => r.cracked).length;

  const cell = { padding: "6px 8px", borderBottom: "1px solid var(--diagram-border)", verticalAlign: "top" as const };

  return (
    <div>
      <div className="diagram-toggle-group" role="tablist" aria-label="Storage scheme">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "plain"}
          className={`diagram-toggle${mode === "plain" ? " diagram-toggle--active" : ""}`}
          onClick={() => setMode("plain")}
        >
          sha256(password)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "salted"}
          className={`diagram-toggle${mode === "salted" ? " diagram-toggle--active" : ""}`}
          onClick={() => setMode("salted")}
        >
          sha256(salt + password)
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--diagram-text)" }}>
          <thead>
            <tr style={{ color: "var(--diagram-text-muted)", textAlign: "left" }}>
              <th style={cell}>user</th>
              <th style={cell}>salt</th>
              <th style={cell}>stored hash</th>
              <th style={cell}>precomputed-table lookup</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td style={cell}>{r.name}</td>
                <td style={{ ...cell, color: "var(--diagram-text-muted)" }}>{r.salt ?? "—"}</td>
                <td style={{ ...cell, color: dupes.has(r.hash) ? "var(--diagram-state-warning)" : "var(--diagram-text)" }}>
                  {r.hash.slice(0, 24)}…
                </td>
                <td style={{ ...cell, color: r.cracked ? "var(--diagram-state-warning)" : "var(--diagram-state-healthy)" }}>
                  {r.cracked ? `cracked: "${r.cracked}"` : "no match"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={captionStyle}>
        {mode === "plain" ? (
          <>
            <strong style={{ color: "var(--diagram-state-warning)" }}>{crackedCount} of 4 cracked instantly</strong> by
            looking the hash up in a table of common-password hashes, and alice and carol's identical hashes reveal they
            share a password. One precomputed table attacks every user in every leaked database at once.
          </>
        ) : (
          <>
            <strong style={{ color: "var(--diagram-state-healthy)" }}>0 cracked by lookup</strong> and no duplicates — the
            salt makes every hash unique, so the precomputed table is useless. The attacker now has to brute-force{" "}
            <em>each user separately</em>, which is why the hash should also be slow (bcrypt/Argon2), not SHA-256.
          </>
        )}
      </p>
    </div>
  );
}
