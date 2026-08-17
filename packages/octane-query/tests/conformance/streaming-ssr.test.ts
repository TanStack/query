// @vitest-environment node

import { QueryClient } from '@tanstack/query-core'
import { renderToReadableStream } from 'octane/server'
import { describe, expect, it } from 'vitest'
import {
  StreamingSuspenseApp,
  WrappedStreamingSuspenseApp,
} from '../_fixtures/streaming-ssr.tsrx'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

async function renderSequentialSuspense(
  component: typeof StreamingSuspenseApp | typeof WrappedStreamingSuspenseApp,
  extraProps: { mode: 'query' | 'queries' } | undefined,
) {
  const a = deferred<string>()
  const b = deferred<string>()
  const bStarted = deferred<void>()
  let bCalls = 0
  const stream = await renderToReadableStream(component, {
    ...extraProps,
    client: new QueryClient(),
    a: () => a.promise,
    b: () => {
      bCalls++
      bStarted.resolve()
      return b.promise
    },
  })
  const responseText = new Response(stream).text()

  let allReady = false
  void stream.allReady.then(() => {
    allReady = true
  })

  a.resolve('A')
  await bStarted.promise
  await Promise.resolve()
  const finishedBeforeBResolved = allReady

  b.resolve('B')
  const html = await responseText

  return { bCalls, finishedBeforeBResolved, html }
}

describe('streaming SSR suspense replay', () => {
  it.each(['query', 'queries'] as const)(
    'waits for both sequential %s hooks',
    async (mode) => {
      const result = await renderSequentialSuspense(StreamingSuspenseApp, {
        mode,
      })

      expect(result.finishedBeforeBResolved).toBe(false)
      expect(result.bCalls).toBe(1)
      expect(result.html).toContain('A/B')
      expect(result.html).not.toContain('A/undefined')
    },
  )

  it('keeps custom hook instances distinct during replay', async () => {
    const result = await renderSequentialSuspense(
      WrappedStreamingSuspenseApp,
      undefined,
    )

    expect(result.finishedBeforeBResolved).toBe(false)
    expect(result.bCalls).toBe(1)
    expect(result.html).toContain('A/B')
    expect(result.html).not.toContain('A/undefined')
  })
})
