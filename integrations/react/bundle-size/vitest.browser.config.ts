import assert from 'node:assert/strict'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

interface PollingGate {
  requested: PromiseWithResolvers<void>
  response: PromiseWithResolvers<void>
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    holdPollingBooks: (adapter: string) => Promise<void>
    waitForPollingRequest: (adapter: string) => Promise<void>
    releasePollingBooks: (adapter: string) => Promise<void>
  }
}

const pendingBooks = new Map<string, PollingGate>()
const booksUrl = (adapter: string) => `/polling/${adapter}/books-1.json`

export default defineConfig({
  root: import.meta.dirname,
  // Serve the measured apps from disk, including their production JS chunks.
  publicDir: 'dist',
  plugins: [
    {
      name: 'hold-polling-fixtures',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const gate = request.url && pendingBooks.get(request.url)
          if (gate) {
            gate.requested.resolve()
            gate.response.promise.then(() => next(), next)
          } else next()
        })
      },
    },
  ],
  test: {
    include: ['browser/*.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      commands: {
        holdPollingBooks(_, adapter: string) {
          pendingBooks.set(booksUrl(adapter), {
            requested: Promise.withResolvers<void>(),
            response: Promise.withResolvers<void>(),
          })
        },
        waitForPollingRequest(_, adapter: string) {
          const gate = pendingBooks.get(booksUrl(adapter))
          assert(gate, 'Missing polling gate for ' + adapter)
          return gate.requested.promise
        },
        releasePollingBooks(_, adapter: string) {
          const url = booksUrl(adapter)
          const gate = pendingBooks.get(url)
          assert(gate, 'Missing polling gate for ' + adapter)
          gate.response.resolve()
          pendingBooks.delete(url)
        },
      },
    },
  },
})
