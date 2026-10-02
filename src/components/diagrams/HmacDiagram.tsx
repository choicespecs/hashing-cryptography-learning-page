import { useEffect, useState } from "react";
import { hmacSha256, toHex, inputStyle, labelStyle, outputStyle, captionStyle } from "./lib/hash";

const SENT = '{"event":"payment.succeeded","order_id":"ord_8812","amount":4999}';

export default function HmacDiagram() {
  const [secret, setSecret] = useState("whsec_shared_between_sender_and_receiver");
  const [received, setReceived] = useState(SENT);
  const [receiverSecret, setReceiverSecret] = useState("whsec_shared_between_sender_and_receiver");
  const [sentSig, setSentSig] = useState("");
  const [expected, setExpected] = useState("");

  useEffect(() => {
    hmacSha256(secret, SENT).then((s) => setSentSig(toHex(s)));
  }, [secret]);

  useEffect(() => {
    hmacSha256(receiverSecret, received).then((s) => setExpected(toHex(s)));
  }, [receiverSecret, received]);

  const valid = sentSig !== "" && sentSig === expected;

  return (
    <div>
      <p style={{ ...labelStyle, marginTop: 0, color: "var(--color-accent)", fontWeight: 600 }}>Sender</p>
      <label style={labelStyle} htmlFor="hmac-secret">
        Shared secret
      </label>
      <input id="hmac-secret" style={inputStyle} value={secret} onChange={(e) => setSecret(e.target.value)} />
      <p style={labelStyle}>Body sent</p>
      <pre style={outputStyle}>{SENT}</pre>
      <p style={labelStyle}>
        Header <code>X-Signature: HMAC-SHA256(secret, body)</code>
      </p>
      <pre style={outputStyle}>{sentSig}</pre>

      <p style={{ ...labelStyle, marginTop: 20, color: "var(--color-accent)", fontWeight: 600 }}>
        Receiver — try editing the body (an attacker in the middle) or the secret
      </p>
      <label style={labelStyle} htmlFor="hmac-received">
        Body received
      </label>
      <input id="hmac-received" style={inputStyle} value={received} onChange={(e) => setReceived(e.target.value)} />
      <label style={labelStyle} htmlFor="hmac-receiver-secret">
        Receiver's copy of the secret
      </label>
      <input id="hmac-receiver-secret" style={inputStyle} value={receiverSecret} onChange={(e) => setReceiverSecret(e.target.value)} />
      <p style={labelStyle}>Receiver recomputes HMAC-SHA256(secret, received body)</p>
      <pre style={{ ...outputStyle, color: valid ? "var(--diagram-state-healthy)" : "var(--diagram-state-warning)" }}>{expected}</pre>

      <p style={captionStyle}>
        {valid ? (
          <>
            <strong style={{ color: "var(--diagram-state-healthy)" }}>Signature valid.</strong> The body is exactly what
            the sender signed, and only someone with the secret could have produced that signature.
          </>
        ) : (
          <>
            <strong style={{ color: "var(--diagram-state-warning)" }}>Signature mismatch — reject the request.</strong>{" "}
            Either the body was altered in transit or the sender doesn't know the secret. An attacker who changes{" "}
            <code>amount</code> can't fix the signature without the key.
          </>
        )}
      </p>
    </div>
  );
}
