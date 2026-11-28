import { readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import core from '../packages/query-core/vite.config.ts'
import react from '../packages/react-query/vite.config.ts'

const adapter = process.env.REACT_QUERY_COMPAT_ADAPTER!
const suite = basename(resolve(process.cwd(), '..'))
const isReact = suite === 'react-query'

const base = isReact ? react : core
const { paths } = JSON.parse(readFileSync('tsconfig.json', 'utf8'))
  .compilerOptions as { paths: Record<string, [string]> }

export default defineConfig({
  ...base,
  resolve: {
    ...base.resolve,
    // Use the same entry points for test execution and type checking.
    alias: Object.fromEntries(
      Object.entries(paths).map(([name, [file]]) => [name, file]),
    ),
  },
  test: {
    ...base.test,
    name: `${basename(adapter)}/${suite}`,
    // Override the relative paths inherited from the upstream project.
    setupFiles: isReact ? [resolve('test-setup.ts')] : [],
    coverage: {
      ...base.test?.coverage,
      include: [
        isReact
          ? join(adapter, 'src/*.{ts,tsx}')
          : join(adapter, '../query-core-pluggable/src/**/*.ts'),
      ],
      reportsDirectory: join(adapter, 'coverage', suite),
      allowExternal: true,
    },
  },
})
