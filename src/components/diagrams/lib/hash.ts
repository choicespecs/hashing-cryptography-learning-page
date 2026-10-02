/**
 * Small, dependency-free helpers shared by the live diagrams. Everything
 * cryptographic goes through the browser's Web Crypto API (crypto.subtle),
 * which supports SHA-1/256/384/512, HMAC, and AES-GCM — but not MD5.
 */

export type ShaAlgo = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const encoder = new TextEncoder();

export async function sha(algo: ShaAlgo, text: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest(algo, encoder.encode(text));
  return new Uint8Array(buf);
}

export async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return new Uint8Array(sig);
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function toBase64(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/** URL- and filename-safe Base64 (RFC 4648 §5), padding stripped. */
export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Alphanumeric-only encoding — treats the bytes as one big unsigned integer. */
export function toBase62(bytes: Uint8Array): string {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  if (n === 0n) return "0";
  let out = "";
  while (n > 0n) {
    out = BASE62[Number(n % 62n)] + out;
    n /= 62n;
  }
  return out;
}

export function utf8Bytes(text: string): Uint8Array<ArrayBuffer> {
  return encoder.encode(text);
}

/** FNV-1a, 32-bit — a fast non-cryptographic hash, good for demos of bucketing. */
export function fnv1a32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Shared inline styles so every live diagram's inputs look the same. */
export const inputStyle = {
  width: "100%",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "var(--diagram-text)",
  background: "var(--diagram-surface)",
  border: "1px solid var(--diagram-border)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 10px",
  boxSizing: "border-box" as const,
};

export const labelStyle = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-sm)",
  color: "var(--diagram-text-muted)",
  margin: "12px 0 4px",
};

export const outputStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--diagram-text)",
  background: "var(--diagram-surface)",
  border: "1px solid var(--diagram-border)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 10px",
  wordBreak: "break-all" as const,
  margin: 0,
};

export const captionStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-sm)",
  color: "var(--diagram-text-muted)",
  margin: "12px 0 0",
};
