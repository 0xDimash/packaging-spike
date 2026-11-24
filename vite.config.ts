import { defineConfig } from 'vite';

// Packaged Electron loads dist/index.html from file:// — absolute /assets paths break.
export default defineConfig({
  base: './',
});
