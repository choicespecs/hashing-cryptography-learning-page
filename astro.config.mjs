// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';

// https://astro.build/config
export default defineConfig({
  site: 'https://choicespecs.github.io',
  base: '/hashing-cryptography-learning-page/',
  integrations: [react(), mdx(), pagefind()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed'
    }
  }
});
