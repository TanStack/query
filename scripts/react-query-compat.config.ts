import { basename, join, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import core from '../packages/query-core/vite.config.ts'
import react from '../packages/react-query/vite.config.ts'

const adapter = process.env.REACT_QUERY_COMPAT_ADAPTER!
const suite = basename(resolve(process.cwd(), '../..'))
const isReact = suite === 'react-query'

const base = isReact ? react : core

export default defineConfig({
  ...base,
  resolve: {
    ...base.resolve,
    alias: {
      '@tanstack/query-core': join(adapter, 'src/index.ts'),
      ...(basename(adapter) === 'react-query-no-core-pluggable' && {
        '@tanstack/query-test-utils/polling': join(
          adapter,
          'tests/compat-polling.ts',
        ),
      }),
    },
  },
  test: {
    ...base.test,
    name: `${basename(adapter)}/${suite}`,
    // Override the relative paths inherited from the upstream project.
    setupFiles: isReact
      ? [resolve(import.meta.dirname, '../packages/react-query/test-setup.ts')]
      : [],
    coverage: {
      ...base.test?.coverage,
      include: [
        join(adapter, isReact ? 'src/*.{ts,tsx}' : 'src/runtime/**/*.ts'),
      ],
      reportsDirectory: join(adapter, 'coverage', suite),
      allowExternal: true,
    },
  },
})
