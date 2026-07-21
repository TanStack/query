---
id: resources
title: Resources
---

> IMPORTANT: The resource APIs (`queryResource`, `infiniteQueryResource`, `mutationResource`) require **Angular 22 or newer**, because they are built on the stable [`resource` snapshot APIs](https://angular.dev/guide/signals/resource) (`resourceFromSnapshots`, `ResourceSnapshot`).

`queryResource` is a resource-shaped alternative to [`injectQuery`](../queries). Instead of returning an object of signals, it returns a real Angular [`Resource<T>`](https://angular.dev/guide/signals/resource), so it composes with everything in Angular that consumes a resource and exposes the familiar `value`/`status`/`error`/`isLoading`/`hasValue`/`snapshot` surface — **plus** all of the TanStack Query result fields.

It is backed by the **same** `QueryClient`, observers and cache as `injectQuery`. A `queryResource` and an `injectQuery` using the same `queryKey` share one cached query and dedupe their fetches — you can mix and match freely.

[//]: # 'Example'

```ts
import { Component, signal } from '@angular/core'
import { queryResource } from '@tanstack/angular-query-experimental'

@Component({
  template: `
    @if (todos.isLoading()) {
      <p>Loading…</p>
    } @else if (todos.hasValue()) {
      <ul>
        @for (todo of todos.value(); track todo.id) {
          <li>{{ todo.title }}</li>
        }
      </ul>
    } @else if (todos.isError()) {
      <p>Error: {{ todos.error()?.message }}</p>
    }
  `,
})
export class TodosComponent {
  filter = signal('')

  todos = queryResource({
    queryKey: () => ['todos', this.filter()],
    queryFn: ({ queryKey }) => fetchTodos(queryKey[1] as string),
    enabled: () => this.filter().length > 0,
    staleTime: 30_000,
  })
}
```

[//]: # 'Example'

## Two ways to pass options

A plain object literal evaluates its fields **eagerly, once**. So a config object can only be reactive in the fields you pass as functions. `queryResource` accepts both forms:

### Config form — `queryResource(config)`

Ergonomic for the common case. `queryKey` and `enabled` may be reactive thunks; every other field is read once.

```ts
todos = queryResource({
  queryKey: () => ['todos', this.filter()], // reactive ✅
  queryFn: ({ queryKey }) => fetchTodos(queryKey[1] as string),
  enabled: () => !!this.filter(), // reactive ✅
  staleTime: 30_000, // static — read once
})
```

> A field passed as a plain value (e.g. `enabled: this.flag()`) is read once and is **not** reactive. Pass a function to make it reactive, or use the options-function form below.

### Options-function form — `queryResource(() => config)`

The whole object is re-evaluated in a reactive context, so **every** embedded signal read is tracked — identical semantics to `injectQuery(() => ({ ... }))`. Use it when you need fields other than `queryKey` / `enabled` to be reactive.

```ts
todos = queryResource(() => ({
  queryKey: ['todos', this.filter()],
  queryFn: () => fetchTodos(this.filter()),
  enabled: !!this.filter(),
  staleTime: this.ttl(), // reactive in this form
}))
```

## The returned handle

`queryResource` returns an Angular `Resource<TData | undefined>` plus query extras.

### Angular `Resource` surface

| Member | Notes |
| --- | --- |
| `value()` | Resource-strict read. **Throws** in the error state — guard with `hasValue()`. |
| `status()` | Angular `ResourceStatus`: `idle \| loading \| reloading \| resolved \| local \| error`. |
| `error()` | `Signal<Error \| undefined>` (resource contract). |
| `isLoading()` | `true` while loading or reloading. |
| `hasValue()` | Whether a value is currently available. |
| `snapshot()` | The full `ResourceSnapshot`. |

### Query extras

| Member | Notes |
| --- | --- |
| `data()` | Last known data — **safe to read in any state** (never throws). Prefer this over `value()`. |
| `queryStatus()` | TanStack status: `pending \| success \| error`. |
| `fetchStatus()` | `idle \| fetching \| paused`. |
| `isPending()` / `isSuccess()` / `isError()` / `isFetching()` / `isStale()` / `isPlaceholderData()` | convenience flags |
| `failureCount()` / `failureReason()` / `dataUpdatedAt()` / `errorUpdatedAt()` | retry + freshness metadata |
| `refetch()` | Manually refetch. |
| `reload()` | Alias for `refetch()` matching the resource API. |
| `set(value)` / `update(fn)` | Optimistically write the cache (through `setQueryData`). |

> `value()` follows Angular's resource contract and throws when the query is in an error state with no value. For a read that never throws, use `data()`.

## Infinite queries

`infiniteQueryResource` is the resource-shaped counterpart of [`injectInfiniteQuery`](../infinite-queries). It adds the infinite-specific fields on top of the base resource surface.

```ts
feed = infiniteQueryResource({
  queryKey: () => ['feed'],
  queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) =>
    lastPage.hasMore ? lastPage.page + 1 : undefined,
})

// feed.value()?.pages, feed.hasNextPage(), feed.fetchNextPage(),
// feed.isFetchingNextPage(), feed.hasPreviousPage(), feed.fetchPreviousPage()
```

## Mutations

`mutationResource` is the resource-shaped counterpart of [`injectMutation`](../mutations). The resource `value` is the result of the most recent mutation; trigger it with `mutate` / `mutateAsync`.

```ts
import { inject } from '@angular/core'
import {
  QueryClient,
  mutationResource,
} from '@tanstack/angular-query-experimental'

class TodosComponent {
  queryClient = inject(QueryClient)

  addTodo = mutationResource({
    mutationFn: (title: string) => api.addTodo(title),
    onSuccess: () =>
      this.queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  add(title: string) {
    this.addTodo.mutate(title)
    // this.addTodo.isPending(), this.addTodo.value(), this.addTodo.error()
  }
}
```

## When should I use the resource APIs?

Reach for `queryResource` when you want the result to **be** an Angular resource — to compose with resource-consuming APIs, to use `value()/status()/hasValue()` and `@if (q.hasValue())` ergonomics, or simply to keep a consistent resource mental model across your app. Everything else (caching, deduping, retries, devtools, persistence, invalidation) is unchanged because it is the same `QueryClient` underneath.

Reach for `injectQuery` when you are targeting an Angular version below 22, or when you prefer the existing flat signal-proxy result shape.

## Notes & differences

- **Shared cache.** `queryResource(['user', 1])` and `injectQuery(() => ({ queryKey: ['user', 1] }))` resolve to the same cached query.
- **`status` is the resource status.** The TanStack `pending | success | error` status is on `queryStatus()`.
- **`error` is `Error | undefined`** to satisfy the resource contract. The typed query error is available via `failureReason()`.
- **Optimistic writes** via `set` / `update` go through `setQueryData`, so they surface as `resolved` (not the resource `local` status).
