/**
 * Shared harness for the SSR → hydration tests.
 *
 * The fixture app in `fixtures/hydration/` is built with vite in a plain node
 * subprocess (vite/esbuild cannot run inside the jsdom worker): a server
 * bundle, a streaming server bundle, and a hydratable client bundle. The
 * subprocess also executes both server entries and returns their reports.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { QueryClient } from '..'

// vitest runs with the package root as cwd; import.meta.url is not a file URL
// inside the jsdom worker.
const fixtureDir = path.join(
  process.cwd(),
  'src',
  '__tests__',
  'fixtures',
  'hydration',
)

interface QuerySnapshot {
  queryKey: Array<string>
  queryHash: string
  state: { data: unknown; dataUpdatedAt: number; status: string }
}

export interface ServerReport {
  string: {
    html: string
    counts: { fresh: number; stale: number }
    queries: Array<QuerySnapshot>
  }
  stream: {
    chunks: Array<{ t: number; payload: string }>
    counts: { header: number; feed: number; tags: number }
    queries: Array<QuerySnapshot>
  }
}

export interface ClientBundle {
  createApp: () => {
    queryClient: QueryClient
    counts: { fresh: number; stale: number }
    mount: (container: HTMLElement) => () => void
  }
  createStreamApp: () => {
    queryClient: QueryClient
    counts: { header: number; feed: number; tags: number }
    mount: (container: HTMLElement) => () => void
  }
}

export interface Harness {
  outDir: string
  report: ServerReport
  clientBundleUrl: string
}

export function buildFixture(): Harness {
  // Must live inside the package so vitest can import the client bundle.
  const outDir = path.join(
    process.cwd(),
    'node_modules',
    '.tmp',
    'hydration-fixture',
  )
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  const report = JSON.parse(
    execFileSync(
      process.execPath,
      [path.join(fixtureDir, 'build-and-render.mjs'), outDir],
      { encoding: 'utf-8' },
    ),
  ) as ServerReport
  return {
    outDir,
    report,
    clientBundleUrl: pathToFileURL(path.join(outDir, 'entry-client.mjs')).href,
  }
}

export function cleanupFixture(harness: Harness | undefined): void {
  if (harness) rmSync(harness.outDir, { recursive: true, force: true })
}

/**
 * Reset the hydration bootstrap the way a fresh document would provide it
 * (normally injected via generateHydrationScript).
 */
export function bootstrapHydrationGlobals(): void {
  ;(globalThis as any)._$HY = {
    events: [],
    completed: new WeakSet(),
    r: {},
    fe() {},
  }
}

/**
 * Append streamed SSR payloads to the container and execute any scripts they
 * carry, in document order, the way a browser's parser would.
 */
export function applyChunks(
  container: HTMLElement,
  payloads: Array<string>,
): void {
  for (const payload of payloads) {
    container.insertAdjacentHTML('beforeend', payload)
    for (const script of Array.from(
      container.querySelectorAll('script:not([data-executed])'),
    )) {
      script.setAttribute('data-executed', 'true')
      if (script.textContent) {
        window.eval(script.textContent)
      }
    }
  }
}

/** Flush microtasks plus one timer turn. */
export function tick(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Drain `n` rounds of the microtask queue without yielding to timers.
 * Used to assert that hydration work happens at microtask timing (i.e.
 * before the task ends — before the browser would paint), not on some
 * later timer or stream event.
 */
export async function microtasks(n = 10): Promise<void> {
  for (let i = 0; i < n; i++) await Promise.resolve()
}
