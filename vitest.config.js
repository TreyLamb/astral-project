import { defineConfig } from 'vitest/config';

// Vitest is scoped to pure-function calculator suites (FitnessTracker, Orbit)
// and the serverless helpers' pure logic (api/_lib) — a plain node environment
// (no jsdom, no React plugin) keeps it fast and isolated from the rest of the
// site. api/_lib tests must import only pure modules (no firebase/network).
export default defineConfig({
  test: {
    include: [
      'src/pages/fitnesstracker/**/*.test.js',
      'src/pages/orbit/**/*.test.js',
      'api/_lib/**/*.test.js',
    ],
    environment: 'node',
  },
});
