import { Transform } from 'node:stream'
import { renderToPipeableStream } from 'preact-render-to-string/stream-node'
import { uneval } from 'devalue'
import { QueryClientProvider, dehydrate, noop } from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import App, { combinedWaits, waits } from './App'
import { makeQueryClient } from './makeQueryClient'
import { waitQueries } from './services/wait/queries'
import type { DehydratedState } from '@tanstack/preact-query'
import type { Writable } from 'node:stream'

export function render(callbacks: {
  onShellReady: () => void
  onError: (error: unknown) => void
}) {
  const queryClient = makeQueryClient()

  // Start every query the page renders up front, so a Suspense boundary
  // never waits for another one to finish before its own fetch starts
  for (const wait of [...waits, ...combinedWaits]) {
    void queryClient.query(waitQueries.detail(wait)).catch(noop)
  }

  // Collect each query's state as soon as it succeeds on the server
  const states: Array<DehydratedState> = []
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'success') {
      states.push(
        dehydrate(queryClient, {
          shouldDehydrateQuery: (query) => query === event.query,
        }),
      )
    }
  })

  // Send the collected states right before the next streamed chunk, so the
  // client has the data of every boundary by the time it hydrates
  const flushStates = () =>
    states
      .splice(0)
      .map(
        (state) =>
          `<script>window.__QUERY_STATES__.push(${uneval(state)});document.currentScript.remove()</script>`,
      )
      .join('')

  const injectStates = new Transform({
    transform(chunk, _encoding, callback) {
      callback(null, flushStates() + chunk)
    },
    flush(callback) {
      callback(null, flushStates())
    },
  })

  const stream = renderToPipeableStream(
    <QueryClientProvider client={queryClient}>
      <App />
      <PreactQueryDevtools />
    </QueryClientProvider>,
    {
      onShellReady: callbacks.onShellReady,
      onAllReady: unsubscribe,
      onError: (error) => {
        // The renderer destroys its own stream on errors and aborts, so end
        // ours as well to let the response finish
        unsubscribe()
        injectStates.end()
        callbacks.onError(error)
      },
    },
  )

  return {
    pipe: (writable: Writable) => {
      injectStates.pipe(writable, { end: false })
      stream.pipe(injectStates)
      return injectStates
    },
    abort: stream.abort,
  }
}
