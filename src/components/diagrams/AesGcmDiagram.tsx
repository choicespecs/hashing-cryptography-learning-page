import { useEffect, useState } from "react";
import { toHex, toBase64, utf8Bytes, inputStyle, labelStyle, outputStyle, captionStyle } from "./lib/hash";

interface Sealed {
  iv: Uint8Array<ArrayBuffer>;
  ct: Uint8Array<ArrayBuffer>;
}

export default function AesGcmDiagram() {
  const [plaintext, setPlaintext] = useState("Meet at the north gate at 9pm.");
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [keyHex, setKeyHex] = useState("");
  const [sealed, setSealed] = useState<Sealed | null>(null);
  const [tampered, setTampered] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const k = (await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])) as CryptoKey;
      setKey(k);
      setKeyHex(toHex(new Uint8Array(await crypto.subtle.exportKey("raw", k))));
    })();
  }, []);

  async function encrypt() {
    if (!key) return;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, utf8Bytes(plaintext)));
    setSealed({ iv, ct });
    setTampered(false);
    setResult(null);
  }

  useEffect(() => {
    encrypt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const shown = sealed
    ? tampered
      ? (() => {
          const c = sealed.ct.slice();
          c[0] ^= 0x01;
          return c;
        })()
      : sealed.ct
    : null;

  async function decrypt() {
    if (!key || !sealed || !shown) return;
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: sealed.iv }, key, shown);
      setResult({ ok: true, text: new TextDecoder().decode(pt) });
    } catch {
      setResult({ ok: false, text: "OperationError — authentication tag check failed. Nothing is returned." });
    }
  }

  return (
    <div>
      <p style={{ ...labelStyle, marginTop: 0 }}>256-bit key (random, generated in your browser just now)</p>
      <pre style={outputStyle}>{keyHex || "…"}</pre>

      <label style={labelStyle} htmlFor="aes-plaintext">
        Plaintext
      </label>
      <input id="aes-plaintext" style={inputStyle} value={plaintext} onChange={(e) => setPlaintext(e.target.value)} />

      <div className="diagram-toggle-group" style={{ marginTop: 12 }}>
        <button type="button" className="diagram-toggle" onClick={encrypt}>
          Encrypt (fresh nonce)
        </button>
        <button
          type="button"
          className={`diagram-toggle${tampered ? " diagram-toggle--active" : ""}`}
          onClick={() => {
            setTampered((t) => !t);
            setResult(null);
          }}
        >
          {tampered ? "Undo bit flip" : "Flip 1 bit of ciphertext"}
        </button>
        <button type="button" className="diagram-toggle" onClick={decrypt}>
          Decrypt
        </button>
      </div>

      <p style={labelStyle}>Nonce / IV (12 bytes, public, must never repeat for this key)</p>
      <pre style={outputStyle}>{sealed ? toHex(sealed.iv) : "…"}</pre>
      <p style={labelStyle}>Ciphertext + 16-byte auth tag (Base64)</p>
      <pre style={{ ...outputStyle, color: tampered ? "var(--diagram-state-warning)" : "var(--diagram-text)" }}>
        {shown ? toBase64(shown) : "…"}
      </pre>

      {result ? (
        <>
          <p style={labelStyle}>Decrypted</p>
          <pre style={{ ...outputStyle, color: result.ok ? "var(--diagram-state-healthy)" : "var(--diagram-state-warning)" }}>{result.text}</pre>
        </>
      ) : null}

      <p style={captionStyle}>
        Click <em>Encrypt</em> twice: same key, same plaintext, completely different ciphertext — because the nonce changes.
        Then flip a bit and decrypt: GCM is <strong style={{ color: "var(--diagram-text)" }}>authenticated</strong>{" "}
        encryption, so tampering is detected instead of silently producing garbage.
      </p>
    </div>
  );
}
