import { useEffect, useState } from "react";
import { sha, toHex, toBase64, utf8Bytes, inputStyle, labelStyle, outputStyle, captionStyle } from "./lib/hash";

type Row = "encode" | "encrypt" | "hash";

const ROWS: { id: Row; title: string; how: string; reverse: string; state: string }[] = [
  {
    id: "encode",
    title: "Encoding — Base64",
    how: "A public, reversible re-spelling of the bytes. No key, no secret.",
    reverse: "Anyone can decode it. Encoding is for transport and formatting, never for security.",
    state: "var(--diagram-state-warning)",
  },
  {
    id: "encrypt",
    title: "Encryption — AES-256-GCM",
    how: "Reversible, but only with the key. Output length grows with the input.",
    reverse: "Whoever holds the key decrypts it back to the exact original. Without the key: noise.",
    state: "var(--diagram-state-healthy)",
  },
  {
    id: "hash",
    title: "Hashing — SHA-256",
    how: "One-way and fixed-size: always 32 bytes, whether the input is 1 byte or 1 GB.",
    reverse: "Nobody can reverse it — not even you. You can only re-hash a guess and compare.",
    state: "var(--color-accent)",
  },
];

export default function EncodingDiagram() {
  const [text, setText] = useState("card ending 4242, exp 09/29");
  const [active, setActive] = useState<Row>("hash");
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [outputs, setOutputs] = useState<Record<Row, string>>({ encode: "", encrypt: "", hash: "" });

  useEffect(() => {
    crypto.subtle
      .generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
      .then((k) => setKey(k as CryptoKey));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const bytes = utf8Bytes(text);
      const hash = toHex(await sha("SHA-256", text));
      let encrypted = "(generating key…)";
      if (key) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
        encrypted = toBase64(iv) + "." + toBase64(ct);
      }
      if (!cancelled) setOutputs({ encode: toBase64(bytes), encrypt: encrypted, hash });
    })();
    return () => {
      cancelled = true;
    };
  }, [text, key]);

  const row = ROWS.find((r) => r.id === active)!;

  return (
    <div>
      <label style={{ ...labelStyle, marginTop: 0 }} htmlFor="encoding-input">
        Input — {utf8Bytes(text).length} bytes
      </label>
      <input id="encoding-input" style={inputStyle} value={text} onChange={(e) => setText(e.target.value)} />

      <div className="diagram-toggle-group" role="tablist" aria-label="Transformation" style={{ marginTop: 16 }}>
        {ROWS.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={active === r.id}
            className={`diagram-toggle${active === r.id ? " diagram-toggle--active" : ""}`}
            onClick={() => setActive(r.id)}
          >
            {r.title.split(" — ")[0]}
          </button>
        ))}
      </div>

      <p style={labelStyle}>
        {row.title} — output is {outputs[active].length} characters
      </p>
      <pre style={outputStyle}>{outputs[active]}</pre>

      <p style={captionStyle}>{row.how}</p>
      <p style={{ ...captionStyle, marginTop: 6 }}>
        <strong style={{ color: row.state }}>Can it be reversed?</strong> {row.reverse}
      </p>
    </div>
  );
}
