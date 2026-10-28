---
id: testing
title: Testing
---

Solid Query works by means of primitives - either the ones we offer or custom ones that wrap around them.

These primitives read the `QueryClient` from `QueryClientProvider`, so they have to run under it. Writing unit tests for them can be done by means of `renderHook` from [Solid Testing Library](https://github.com/solidjs/solid-testing-library).

Install this by running:

```sh
npm install @solidjs/testing-library --save-dev
```

## Our First Test

Once installed, a simple test can be written. Given the following custom primitive:

```tsx
export function useCustomQuery() {
  return useQuery(() => ({ queryKey: ['customQuery'], queryFn: () => 'Hello' }))
}
```

We can write a test for this as follows:

```tsx
import { renderHook, waitFor } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import type { ParentProps } from 'solid-js'

const queryClient = new QueryClient()
const wrapper = (props: ParentProps) => (
  <QueryClientProvider client={queryClient}>
    {props.children}
  </QueryClientProvider>
)

const { result } = renderHook(() => useCustomQuery(), { wrapper })

await waitFor(() => expect(result.isSuccess).toBe(true))

expect(result.data).toEqual('Hello')
```

Note that we provide a custom wrapper that builds the `QueryClient` and `QueryClientProvider`. This helps to ensure that our test is completely isolated from any other tests.

It is possible to write this wrapper only once, but if so we need to ensure that the `QueryClient` gets cleared before every test, and that tests don't run in parallel otherwise one test will influence the results of others.

`result` is the reactive object that `useQuery` returns, not a snapshot, so read its properties after waiting instead of destructuring them up front. A destructured value keeps the value it had when it was read.

`waitFor` retries the assertion until it passes, which works for query functions that wait on real requests. When the query function waits on a timer, you can use fake timers and advance them instead, for example with [`vi.advanceTimersByTimeAsync`](https://vitest.dev/api/vi.html#vi-advancetimersbytimeasync) in Vitest. Restore real timers in `afterEach`, so they are restored even when an assertion fails:

```tsx
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('should resolve the delayed query', async () => {
  const { result } = renderHook(
    () =>
      useQuery(() => ({
        queryKey: ['delayed'],
        queryFn: () =>
          new Promise((resolve) => setTimeout(() => resolve('Hello'), 1000)),
      })),
    { wrapper },
  )

  await vi.advanceTimersByTimeAsync(1000)

  expect(result.data).toEqual('Hello')
})
```

For more complex primitives, it can be easier to test the component that uses them instead, by rendering it with `render` from Solid Testing Library under the same `QueryClientProvider` and asserting on what it renders.

## Turn off retries

The library defaults to three retries with exponential backoff, which means that your tests are likely to timeout if you want to test an erroneous query. The easiest way to turn retries off is via the `QueryClient` that you pass to `QueryClientProvider`. Let's extend the above example:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ turns retries off
      retry: false,
    },
  },
})
const wrapper = (props: ParentProps) => (
  <QueryClientProvider client={queryClient}>
    {props.children}
  </QueryClientProvider>
)
```

This will set the defaults for all queries in the component tree to "no retries". It is important to know that this will only work if your actual `useQuery` has no explicit retries set. If you have a query that wants 5 retries, this will still take precedence, because defaults are only taken as a fallback.

## Set gcTime to Infinity with Jest

If you use Jest, you can set the `gcTime` to `Infinity` to prevent "Jest did not exit one second after the test run completed" error message. This is the default behavior on the server, and is only necessary to set if you are explicitly setting a `gcTime`.
