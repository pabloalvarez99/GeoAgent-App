import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/hooks/**',
        'src/components/ui/status-badge.tsx',
        'src/components/ui/button.tsx',
        'src/components/ui/badge.tsx',
        'src/components/forms/**',
        'src/components/drillhole/stratigraphic-column.tsx',
        'src/components/layout/header.tsx',
        'src/components/layout/command-palette.tsx',
        'src/components/layout/sidebar.tsx',
      ],
      exclude: ['**/*.test.*', '**/*.d.ts'],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 80,
        branches: 85,
      },
    },
  },
});
