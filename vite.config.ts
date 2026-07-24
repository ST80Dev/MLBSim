/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base per GitHub Pages: il sito viene servito da
// https://<utente>.github.io/MLBSim/. Override via BASE_PATH (es. '/' su VPS).
const base = process.env.BASE_PATH ?? '/MLBSim/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
