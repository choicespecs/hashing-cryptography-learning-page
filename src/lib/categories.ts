export const CATEGORIES = [
  { id: "fundamentals", title: "Fundamentals" },
  { id: "practical-hashing", title: "Practical Hashing" },
  { id: "passwords-and-authentication", title: "Passwords & Authentication" },
  { id: "cryptography", title: "Cryptography" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryMeta(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)!;
}
