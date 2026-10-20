---
id: testing
title: Testing
---

Most Angular tests using TanStack Query will involve services or components that call `injectQuery`/`injectMutation`.

TanStack Query's `inject*` functions integrate with [`PendingTasks`](https://angular.dev/api/core/PendingTasks) which ensures the framework is aware of in-progress queries and mutations.

This lets the framework, for example during SSR, wait until mutations and queries resolve. In unit tests, `ApplicationRef.whenStable()` and `fixture.whenStable()` work for both Zone.js and Zoneless setups when the work settles right away, such as a synchronous query function or a response flushed through `HttpTestingController`. They can resolve before a query or mutation that takes time settles, so advance fake timers instead, as shown in the sections below.

> This integration requires Angular 19 or later. Earlier versions of Angular do not support `PendingTasks`.

## TestBed setup

Create a fresh `QueryClient` for every spec and provide it with `provideTanStackQuery` or `provideQueryClient`. This keeps caches isolated and lets you change default options per test:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // ✅ faster failure tests
    },
  },
})

TestBed.configureTestingModule({
  providers: [provideTanStackQuery(queryClient)],
})
```

> If your applications actual TanStack Query config is used in unit tests, make sure `withDevtools` is not accidentally included in test providers. This can cause slow tests. It is best to keep test and production configs separate.

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

TestBed.tick() // Trigger effect

// Application is stable when queries are idle
await appRef.whenStable()

expect(query.status()).toBe('success')
expect(query.data()).toBe('Hello')
```

Here `whenStable()` resolves after the query settles because the query function returns right away. When using fake timers (Vitest), advance the clock and a microtask before awaiting stability:

```ts
await vi.advanceTimersByTimeAsync(0)
await Promise.resolve()
await appRef.whenStable()
```

## Testing components

For components, create them through `TestBed.createComponent`. `fixture.whenStable()` can resolve before the query data arrives, so with fake timers, advance the clock past the query function's delay, then run `fixture.detectChanges()` and assert on what the component renders:

```angular-ts
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('should render the query data', async () => {
  @Component({
    template: `<p>{{ query.data()?.value ?? 'Loading...' }}</p>`,
  })
  class ExampleComponent {
    readonly query = injectQuery(() => ({
      queryKey: ['example'],
      queryFn: () =>
        new Promise<{ value: number }>((resolve) =>
          setTimeout(() => resolve({ value: 42 }), 10),
        ),
    }))
  }

  const fixture = TestBed.createComponent(ExampleComponent)
  fixture.detectChanges()
  expect(fixture.nativeElement.textContent).toContain('Loading...')

  await vi.advanceTimersByTimeAsync(11)
  fixture.detectChanges()

  expect(fixture.nativeElement.textContent).toContain('42')
})
```

If you use [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/), render the component with `render` and follow the same flow, running change detection through `rendered.fixture`:

```angular-ts
it('should render the query data', async () => {
  @Component({
    template: `<p>{{ query.data()?.value ?? 'Loading...' }}</p>`,
  })
  class ExampleComponent {
    readonly query = injectQuery(() => ({
      queryKey: ['example'],
      queryFn: () =>
        new Promise<{ value: number }>((resolve) =>
          setTimeout(() => resolve({ value: 42 }), 10),
        ),
    }))
  }

  const rendered = await render(ExampleComponent)
  expect(rendered.getByText('Loading...')).toBeInTheDocument()

  await vi.advanceTimersByTimeAsync(11)
  rendered.fixture.detectChanges()

  expect(rendered.getByText('42')).toBeInTheDocument()
})
```

To test the same query without a component, create it with `TestBed.runInInjectionContext`, advance the clock the same way, and assert on its signals:

```ts
it('should resolve the query data', async () => {
  const query = TestBed.runInInjectionContext(() =>
    injectQuery(() => ({
      queryKey: ['example'],
      queryFn: () =>
        new Promise<{ value: number }>((resolve) =>
          setTimeout(() => resolve({ value: 42 }), 10),
        ),
    })),
  )
  expect(query.isPending()).toBe(true)

  await vi.advanceTimersByTimeAsync(11)

  expect(query.data()).toEqual({ value: 42 })
})
```

## Handling retries

Retries slow failing tests because the default backoff runs three times. Set `retry: false` (or a specific number) through `defaultOptions` or per query to keep tests fast. If a query intentionally retries, assert on the final state rather than intermediate counts.

## HttpClient & network stubs

Angular's `HttpClient` testing utilities play nicely with PendingTasks. Register `provideHttpClient()` and `provideHttpClientTesting()` alongside the Query provider and flush responses through `HttpTestingController`:

```ts
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideTanStackQuery(queryClient),
  ],
})

const httpCtrl = TestBed.inject(HttpTestingController)
const query = TestBed.runInInjectionContext(() =>
  injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => lastValueFrom(TestBed.inject(HttpClient).get('/api/todos')),
  })),
)

const fixturePromise = TestBed.inject(ApplicationRef).whenStable()
httpCtrl.expectOne('/api/todos').flush([{ id: 1 }])
await fixturePromise

expect(query.data()).toEqual([{ id: 1 }])
httpCtrl.verify()
```

## Infinite queries & pagination

`whenStable()` can resolve before the pages of an infinite query reach the `data()` signal. With fake timers, advance the clock past the query function's delay instead, call `fetchNextPage()`, and advance it again before asserting on `data().pages`. Restore real timers in `afterEach`, so they are restored even when an assertion fails:

```ts
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('should load the next page', async () => {
  const infinite = TestBed.runInInjectionContext(() =>
    injectInfiniteQuery(() => ({
      queryKey: ['pages'],
      queryFn: ({ pageParam }) =>
        new Promise<string>((resolve) =>
          setTimeout(() => resolve(`page ${pageParam}`), 10),
        ),
      initialPageParam: 1,
      getNextPageParam: (_lastPage, allPages) => allPages.length + 1,
    })),
  )

  await vi.advanceTimersByTimeAsync(11)
  expect(infinite.data()?.pages).toEqual(['page 1'])

  void infinite.fetchNextPage()
  await vi.advanceTimersByTimeAsync(11)
  expect(infinite.data()?.pages).toEqual(['page 1', 'page 2'])
})
```

## Mutations and optimistic updates

`whenStable()` can resolve before a mutation started with `mutate()` settles. With fake timers enabled as in the examples above, advance the clock past the mutation function's delay before asserting on the result:

```ts
it('should uppercase the input', async () => {
  const mutation = TestBed.runInInjectionContext(() =>
    injectMutation(() => ({
      mutationFn: (input: string) =>
        new Promise<string>((resolve) =>
          setTimeout(() => resolve(input.toUpperCase()), 10),
        ),
    })),
  )

  mutation.mutate('test')
  await vi.advanceTimersByTimeAsync(11)

  expect(mutation.isSuccess()).toBe(true)
  expect(mutation.data()).toBe('TEST')
})
```

## Quick checklist

- Fresh `QueryClient` per test (and clear it afterwards)
- Disable or control retries to avoid timeouts
- Advance timers + microtasks before `whenStable()` when using fake timers
- Use `provideHttpClientTesting()` or your preferred mock to assert network calls
- Advance timers past the query or mutation function after every `refetch`, `fetchNextPage()`, or mutation instead of awaiting `whenStable()`
- Prefer `TestBed.runInInjectionContext` for service tests, and `TestBed.createComponent` or Angular Testing Library's `render` with `fixture.detectChanges()` for component tests
