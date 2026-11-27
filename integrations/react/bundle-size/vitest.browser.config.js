import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

const pendingBooks = new Map()
const booksUrl = (adapter) => `/polling/${adapter}/books-1.json`

export default defineConfig({
  root: import.meta.dirname,
  // Serve the measured apps from disk, including their production JS chunks.
  publicDir: 'dist',
  plugins: [
    {
      name: 'hold-polling-fixtures',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const gate = pendingBooks.get(request.url)
          if (gate) {
            gate.requested.resolve()
            gate.response.promise.then(() => next(), next)
          } else next()
        })
      },
    },
  ],
  test: {
    include: ['browser/*.test.js'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      commands: {
        holdPollingBooks(_, adapter) {
          pendingBooks.set(booksUrl(adapter), {
            requested: Promise.withResolvers(),
            response: Promise.withResolvers(),
          })
        },
        waitForPollingRequest(_, adapter) {
          return pendingBooks.get(booksUrl(adapter)).requested.promise
        },
        releasePollingBooks(_, adapter) {
          const url = booksUrl(adapter)
          pendingBooks.get(url).response.resolve()
          pendingBooks.delete(url)
        },
      },
    },
  },
})
