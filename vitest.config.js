import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest is scoped to pure-function suites (FitnessTracker, Orbit, TKB/AFOQT engine)
// and the serverless helpers' pure logic (api/_lib) — a plain node environment
// keeps it fast and isolated from the rest of the site. api/_lib tests must
// import only pure modules (no firebase/network).
//
// The error-boundary suites are the one exception: a boundary can only be
// verified by actually rendering, so those files opt into jsdom individually
// with a `// @vitest-environment jsdom` docblock. The default stays `node`, so
// every existing suite runs exactly as before.
export default defineConfig({
  // Needed for the JSX in the boundary tests. Harmless for the node suites —
  // it only registers a transform.
  plugins: [react()],
  define: {
    // vite.config.js stamps this at build time; tests need it to exist.
    __BUILD_ID__: JSON.stringify('test'),
  },
  test: {
    include: [
      'src/components/errors/**/*.test.{js,jsx}',
      'src/pages/fitnesstracker/**/*.test.js',
      'src/pages/orbit/**/*.test.js',
      'src/pages/eftShopping/**/*.test.js',
      'src/pages/TranscriptTool/**/*.test.{js,jsx}',
      'src/pages/theknowledgebase/**/*.test.js',
      // Shared engines used by more than one sub-app (currently the TTS adapter).
      'src/pages/shared/**/*.test.js',
      'api/_lib/**/*.test.js',
    ],
    environment: 'node',
  },
});
