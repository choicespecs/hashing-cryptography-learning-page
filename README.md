# Hash Notes — A Hashing & Cryptography Field Guide

A personal reference for hashing and cryptography, with live diagrams that run real SHA-256, HMAC, and AES-GCM in the browser (Web Crypto API).

**Live site:** https://choicespecs.github.io/hashing-cryptography-learning-page/

## Topics

**Fundamentals**
- What a Hash Function Is — determinism, avalanche, preimage/collision resistance
- Hashing vs. Encryption vs. Encoding
- Choosing a Hash Algorithm — MD5, SHA-1/2/3, BLAKE, xxHash, bcrypt, Argon2

**Practical Hashing**
- Shortening Strings with Hashes — fit a long string under a length limit (hash → encode → truncate), with collision math and copy-paste code in Python, JS, Java, Go, SQL
- Hash Tables, Sharding & Bloom Filters — consistent hashing, rendezvous hashing, Bloom filters
- Integrity, Dedup & Content Addressing — checksums, ETags, Merkle trees, git

**Passwords & Authentication**
- Salting & Password Hashing — rainbow tables, salt, pepper, Argon2id/bcrypt
- HMAC & Signed Tokens — webhooks, JWTs, signed URLs, storing API keys

**Cryptography**
- Symmetric Encryption — AES-GCM, nonces, envelope encryption
- Public-Key Cryptography & Signatures — RSA, ECDSA, Ed25519, TLS 1.3

## Development

Built with Astro + MDX + React islands, with Pagefind search.

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Start the dev server at `localhost:4321`    |
| `npm run build`   | Build the static site to `./dist/`          |
| `npm run preview` | Preview the build locally                   |

Topics live in `src/content/topics/*.mdx`; interactive diagrams in `src/components/diagrams/`. Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
