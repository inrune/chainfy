import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @solana/web3.js expects a Node-ish `global` and `Buffer` in the browser.
// `global: 'globalThis'` here + the Buffer shim in src/main.jsx covers it.
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the backend during development.
      '/api': 'http://localhost:4000',
    },
  },
});
