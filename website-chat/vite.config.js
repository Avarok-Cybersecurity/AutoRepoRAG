// SPDX-License-Identifier: Apache-2.0
// Library build: one ESM file with the Svelte runtime bundled
// (dist/repo-chat.js) and one stylesheet (dist/repo-chat.css). dist/ is
// committed; CI rebuilds it and fails on any difference, so the bytes a site
// vendors are the bytes this source produces.

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: () => 'repo-chat.js',
      cssFileName: 'repo-chat',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022',
    minify: true,
  },
});
