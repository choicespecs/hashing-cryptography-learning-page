import { useState } from "react";
import { Node } from "./primitives/Node";
import { Arrow } from "./primitives/Arrow";
import { InfoPanel } from "./primitives/InfoPanel";

type Mode = "encrypt" | "sign";

interface Step {
  label: string;
  content: string;
}

const FLOWS: Record<Mode, { sender: string; senderKey: string; receiver: string; receiverKey: string; wire: string; steps: Record<string, Step> }> = {
  encrypt: {
    sender: "Alice",
    senderKey: "uses Bob's PUBLIC key",
    receiver: "Bob",
    receiverKey: "uses his PRIVATE key",
    wire: "ciphertext",
    steps: {
      sender: { label: "Alice encrypts", content: "Alice looks up Bob's public key (anyone may have it) and encrypts the message with it. Once encrypted, even Alice can't decrypt it." },
      wire: { label: "On the wire", content: "Eve can see the ciphertext and Bob's public key. Neither helps: recovering the private key from the public key is computationally infeasible." },
      receiver: { label: "Bob decrypts", content: "Only the matching private key — which never leaves Bob's machine — can decrypt. Goal achieved: CONFIDENTIALITY. In practice this is only used to deliver a symmetric key (hybrid encryption)." },
    },
  },
  sign: {
    sender: "Alice",
    senderKey: "uses her PRIVATE key",
    receiver: "Bob",
    receiverKey: "uses Alice's PUBLIC key",
    wire: "message + signature",
    steps: {
      sender: { label: "Alice signs", content: "Alice hashes the message and signs the hash with her private key. Only she can produce this signature." },
      wire: { label: "On the wire", content: "The message travels in the clear — signatures don't hide anything. If Eve alters a single byte, the hash changes and the signature no longer matches." },
      receiver: { label: "Bob verifies", content: "Anyone with Alice's public key can verify. Goal achieved: AUTHENTICITY + INTEGRITY + NON-REPUDIATION (Alice can't later deny signing it). This is how TLS certificates, JWT RS256/ES256, and git commit signing work." },
    },
  },
};

export default function PublicKeyDiagram() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [selected, setSelected] = useState<string | null>(null);
  const flow = FLOWS[mode];
  const step = selected ? flow.steps[selected] : null;

  return (
    <div>
      <div className="diagram-toggle-group" role="tablist" aria-label="Public-key operation">
        {(["encrypt", "sign"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`diagram-toggle${mode === m ? " diagram-toggle--active" : ""}`}
            onClick={() => {
              setMode(m);
              setSelected(null);
            }}
          >
            {m === "encrypt" ? "Encrypt (keep it secret)" : "Sign (prove who sent it)"}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 600 170" width="100%" role="img" aria-label={`Public-key ${mode} flow`}>
        <Node x={0} y={40} width={160} height={56} label={flow.sender} sublabel={flow.senderKey} state="healthy" onClick={() => setSelected("sender")} />
        <Arrow x1={164} y1={68} x2={216} y2={68} state="neutral" />
        <Node x={220} y={40} width={160} height={56} label={flow.wire} sublabel="visible to Eve" state="warning" onClick={() => setSelected("wire")} />
        <Arrow x1={384} y1={68} x2={436} y2={68} state="neutral" />
        <Node x={440} y={40} width={160} height={56} label={flow.receiver} sublabel={flow.receiverKey} state="healthy" onClick={() => setSelected("receiver")} />
        <text x={300} y={140} textAnchor="middle" fill="var(--diagram-text-muted)" fontFamily="var(--font-sans)" fontSize="12">
          {mode === "encrypt"
            ? "Encrypt with the RECEIVER's public key → only the receiver can read it"
            : "Sign with the SENDER's private key → anyone can check who wrote it"}
        </text>
      </svg>
      <InfoPanel label={step?.label ?? null} content={step?.content ?? null} hint="Click a box to step through the flow." />
    </div>
  );
}
