/** @vitest-environment node */
// cspell:ignore instrumenter

import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer } from 'vite'
import solid from 'vite-plugin-solid'
import type { Plugin, ViteDevServer } from 'vite'
import type * as SsrEntry from './fixtures/ssr-entry'

const PACKAGE_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SSR_ENTRY_PATH = '/src/__tests__/fixtures/ssr-entry.tsx'
const USE_BASE_QUERY_PATH = fileURLToPath(
  new URL('../useBaseQuery.ts', import.meta.url),
)
const SCRIPT_TAG = '<script>'
const COVERAGE_GLOBAL = '__VITEST_COVERAGE__'
const moduleResolver = createRequire(import.meta.url)
const coverageModuleResolver = createRequire(
  moduleResolver.resolve('@vitest/coverage-istanbul'),
)
const { createInstrumenter } = coverageModuleResolver('istanbul-lib-instrument')
const SOLID_SERVER_ENTRY = moduleResolver.resolve('solid-js/dist/server.js')
const SOLID_STORE_SERVER_ENTRY = moduleResolver.resolve(
  'solid-js/store/dist/server.js',
)
const SOLID_WEB_SERVER_ENTRY = moduleResolver.resolve(
  'solid-js/web/dist/server.js',
)

function createSsrCoveragePlugin(): Plugin {
  const instrumenter = createInstrumenter({
    autoWrap: false,
    compact: false,
    coverageGlobalScope: 'globalThis',
    coverageGlobalScopeFunc: false,
    coverageVariable: COVERAGE_GLOBAL,
    esModules: true,
    produceSourceMap: true,
  })

  return {
    name: 'solid-query-ssr-coverage',
    enforce: 'post',
    transform(sourceCode, id) {
      if (id.split('?', 1)[0] !== USE_BASE_QUERY_PATH) {
        return
      }

      const sourceMap = this.getCombinedSourcemap()
      const code = instrumenter.instrumentSync(sourceCode, id, sourceMap)

      return { code, map: instrumenter.lastSourceMap() }
    },
  }
}

describe('server rendering', () => {
  let viteServer: ViteDevServer

  beforeAll(async () => {
    viteServer = await createServer({
      root: PACKAGE_ROOT,
      appType: 'custom',
      logLevel: 'silent',
      plugins: [solid(), createSsrCoveragePlugin()],
      resolve: {
        alias: [
          { find: /^solid-js$/, replacement: SOLID_SERVER_ENTRY },
          { find: /^solid-js\/store$/, replacement: SOLID_STORE_SERVER_ENTRY },
          { find: /^solid-js\/web$/, replacement: SOLID_WEB_SERVER_ENTRY },
        ],
        conditions: ['node', '@tanstack/custom-condition'],
      },
      ssr: {
        noExternal: ['solid-js', '@tanstack/query-core'],
      },
      server: {
        middlewareMode: true,
      },
    })
  })

  afterAll(async () => {
    await viteServer.close()
  })

  it('waits for a curried query when rendering status branches', async () => {
    const { expectedQueryResult, getCoverage, render, successLabel } =
      (await viteServer.ssrLoadModule(SSR_ENTRY_PATH)) as typeof SsrEntry

    const { markup, queryFnCalls } = await render()
    const parentCoverage = Reflect.get(globalThis, COVERAGE_GLOBAL)
    const ssrCoverage = getCoverage()

    expect(ssrCoverage).toHaveProperty(USE_BASE_QUERY_PATH)

    // Vite's SSR runner has its own global scope, so forward its counters to
    // Vitest when coverage is enabled in the parent test process.
    if (parentCoverage && ssrCoverage) {
      Object.assign(parentCoverage, ssrCoverage)
    }

    const renderedContent = markup.split(SCRIPT_TAG, 1)[0]

    expect(renderedContent).toContain(successLabel)
    expect(renderedContent).toContain(expectedQueryResult)
    expect(queryFnCalls).toBe(1)
  })

  it('renders initial data without waiting for a server refetch', async () => {
    const { initialQueryResult, renderWithInitialData, successLabel } =
      (await viteServer.ssrLoadModule(SSR_ENTRY_PATH)) as typeof SsrEntry

    const { markup, queryFnCalls } = await renderWithInitialData()
    const renderedContent = markup.split(SCRIPT_TAG, 1)[0]

    expect(renderedContent).toContain(successLabel)
    expect(renderedContent).toContain(initialQueryResult)
    expect(queryFnCalls).toBe(1)
  })
})
