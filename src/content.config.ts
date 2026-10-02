import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const topics = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/topics" }),
  schema: z.object({
    title: z.string(),
    category: z.enum([
      "fundamentals",
      "practical-hashing",
      "passwords-and-authentication",
      "cryptography",
    ]),
    order: z.number(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { topics };
