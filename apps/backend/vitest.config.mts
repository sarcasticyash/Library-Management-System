import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      clean: false,
      cleanOnRerun: false,
      reporter: ['text', 'json', 'html'],
      include: [
        'src/services/**',
        'src/utils/**',
        'src/schemas/**',
        'src/middleware/**',
        'src/controllers/**',
      ],
      exclude: [
        'src/server.ts',
        'src/config/**',
        'src/types/**',
        'src/repositories/**',
        'src/models/**',
        'src/routes/**',
        '**/*.d.ts',
        '**/*.interface.ts',
        'src/services/service.container.ts',
        'src/services/index.ts',
        'src/schemas/index.ts',
        'src/middleware/index.ts',
        'src/controllers/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
