import { defineConfig } from 'vitest/config';

// Vitest is scoped to the FitnessTracker calculator suite — pure functions, so a
// plain node environment (no jsdom, no React plugin) keeps it fast and isolated
// from the rest of the site.
export default defineConfig({
  test: {
    include: ['src/pages/fitnesstracker/**/*.test.js'],
    environment: 'node',
  },
});
