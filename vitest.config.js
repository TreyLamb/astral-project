import { defineConfig } from 'vitest/config';

// Vitest is scoped to pure-function calculator suites (FitnessTracker, Orbit)
// — a plain node environment (no jsdom, no React plugin) keeps it fast and
// isolated from the rest of the site.
export default defineConfig({
  test: {
    include: ['src/pages/fitnesstracker/**/*.test.js', 'src/pages/orbit/**/*.test.js'],
    environment: 'node',
  },
});
