---
id: testing
title: Testing
---

Most Angular tests using TanStack Query will involve services or components that call `injectQuery`/`injectMutation`.

TanStack Query's `inject*` functions integrate with [`PendingTasks`](https://angular.dev/api/core/PendingTasks) which ensures the framework is aware of in-progress queries and mutations.

This means tests and SSR can wait until mutations and queries resolve. In unit tests you can use `ApplicationRef.whenStable()` or `fixture.whenStable()` to await query completion. This works for both Zone.js and Zoneless setups.

> This adapter requires Angular 20.1 or later. It uses `PendingTasks` to keep application stability open while observed work is pending.

## TestBed setup

Create a fresh `QueryClient` for every spec and return it from the provider factory. Keeping a reference makes it easy to inspect or clear the cache:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // ✅ faster failure tests
    },
  },
})

TestBed.configureTestingModule({
  providers: [provideTanStackQuery(() => queryClient)],
})
```

> If your application's TanStack Query config is used in unit tests, make sure `withDevtools` is not accidentally included in test providers. This can cause slow tests. It is best to keep test and production configs separate.

If you share helpers, remember to call `queryClient.clear()` (or build a new instance) in `afterEach` so data from one test never bleeds into another.

## First query test

Query tests typically run inside `TestBed.runInInjectionContext`, then wait for stability:

```ts
const appRef = TestBed.inject(ApplicationRef)
const query = TestBed.runInInjectionContext(() =>
  injectQuery(() => ({
    queryKey: ['greeting'],
    queryFn: () => 'Hello',
  })),
)

TestBed.tick() // Synchronize the test application

// Application is stable when queries are idle
await appRef.whenStable()

expect(query.status()).toBe('success')
expect(query.data()).toBe('Hello')
```

PendingTasks will have `whenStable()` resolve after the query settles. When using fake timers (Vitest), advance the clock and a microtask before awaiting stability:

```ts
await vi.advanceTimersByTimeAsync(0)
await Promise.resolve()
await appRef.whenStable()
```

## Testing components

For components, bootstrap them through `TestBed.createComponent`, then await `fixture.whenStable()`:

```ts
const fixture = TestBed.createComponent(ExampleComponent)
fixture.autoDetectChanges()

await fixture.whenStable()
expect(fixture.componentInstance.query.data()).toEqual({ value: 42 })
```

## Handling retries

Retries slow failing tests because the default backoff runs three times. Set `retry: false` (or a specific number) through `defaultOptions` or per query to keep tests fast. If a query intentionally retries, assert on the final state rather than intermediate counts.

## HttpClient & network stubs

Angular's `provideHttpClientTesting` plays nicely with PendingTasks. Register it after
`provideHttpClient`, alongside the Query provider, and flush responses through
`HttpTestingController`:

```ts
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideTanStackQuery(() => queryClient),
  ],
})

const httpCtrl = TestBed.inject(HttpTestingController)
const query = TestBed.runInInjectionContext(() =>
  injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => lastValueFrom(TestBed.inject(HttpClient).get('/api/todos')),
  })),
)

TestBed.tick() // Synchronize the test application so the request starts
const fixturePromise = TestBed.inject(ApplicationRef).whenStable()
httpCtrl.expectOne('/api/todos').flush([{ id: 1 }])
await fixturePromise

expect(query.data()).toEqual([{ id: 1 }])
httpCtrl.verify()
```

Test observable results after normal Angular initialization and updates. For components, render
with `fixture.detectChanges()` and await `fixture.whenStable()` when the operation should finish.
For injection-context-only tests, synchronize the test application as shown above. When using
HTTP mocks or fake timers, flush the request or advance time before awaiting stability.

Avoid asserting an exact subscription order or a stale intermediate value during initialization.
Those are implementation details. To test pending mutation or fetching state, hold the operation
open with a controlled promise and assert after rendering; do not await stability until you
resolve that promise. To test completed state, resolve the operation and await stability before
asserting the result.

## Infinite queries & pagination

Use the same pattern for infinite queries: call `fetchNextPage()`, advance timers if you are faking time, then await stability and assert on `data().pages`.

```ts
const infinite = TestBed.runInInjectionContext(() =>
  injectInfiniteQuery(() => ({
    queryKey: ['pages'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (last, all) => all.length + 1,
  })),
)

TestBed.tick()
await appRef.whenStable()
expect(infinite.data()?.pages).toHaveLength(1)

await infinite.fetchNextPage()
await appRef.whenStable()

expect(infinite.data()?.pages).toHaveLength(2)
```

## Mutations and optimistic updates

```ts
const mutation = TestBed.runInInjectionContext(() =>
  injectMutation(() => ({
    mutationFn: async (input: string) => input.toUpperCase(),
  })),
)

mutation.mutate('test')

// Synchronize the test application
TestBed.tick()

await appRef.whenStable()

expect(mutation.isSuccess()).toBe(true)
expect(mutation.data()).toBe('TEST')
```

`whenStable()` waits for every mutation invocation, including awaited lifecycle callbacks.
Resolve or reject all outstanding mocked mutations before awaiting stability; calling `reset()`
does not finish a request. Queries paused offline also keep stability open until resumed or cancelled.

## Quick checklist

- Fresh `QueryClient` per test (and clear it afterwards)
- Disable or control retries to avoid timeouts
- Advance timers + microtasks before `whenStable()` when using fake timers
- Use `provideHttpClientTesting` or your preferred mock to assert network calls
- Await `whenStable()` after every `refetch`, `fetchNextPage`, or mutation
- Prefer `TestBed.runInInjectionContext` for service tests and `fixture.whenStable()` for component tests
