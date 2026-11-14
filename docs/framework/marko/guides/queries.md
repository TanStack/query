---
id: queries
title: Queries
---

Start with [Installation](../installation.md) and [Quick Start](../quick-start.md) before you use query tags in your templates.

## Query Basics

A query is a declarative dependency on an asynchronous source of data tied to a unique key. Use queries for reading server state. If a function creates, updates, or deletes server data, use a [mutation](./mutations.md) instead.

In Marko, subscribe to a query with the `<query>` tag:

```marko
<query/todos options=() => ({ queryKey: ["todos"], queryFn: fetchTodos })/>

<if=todos.isPending>
  <p>Loading...</p>
</if>
<else-if=todos.isError>
  <p>Error: ${todos.error.message}</p>
</else-if>
<else>
  <ul>
    <for|todo| of=todos.data by="id">
      <li>${todo.title}</li>
    </for>
  </ul>
</else>
```

The tag needs:

- A tag variable, such as `/todos`, to receive the result
- An `options` function that returns the query options
- A unique `queryKey` in the options
- A `queryFn` in the options that returns a promise and throws on errors

The tag variable holds the current `QueryObserverResult`, plus `refetch`.

## Query States

A query can be in one primary state at a time:

- `isPending` or `status === 'pending'`: no data is available yet
- `isError` or `status === 'error'`: the query failed and `error` is available
- `isSuccess` or `status === 'success'`: data is available

The result also includes `isFetching`, which can be true during the initial load or a background refetch.

TypeScript will narrow `todos.data` after you check `isPending` and `isError` before reading it.

## Fetch Status

The `status` field describes whether data is available. The `fetchStatus` field describes what the query function is doing:

- `fetchStatus === 'fetching'`: the query is currently fetching.
- `fetchStatus === 'paused'`: the query wanted to fetch, but fetching is paused.
- `fetchStatus === 'idle'`: the query is not fetching.

These states are intentionally separate. Background refetching and stale-while-revalidate behavior can produce combinations like:

- A successful query with cached data can have `status === 'success'` and `fetchStatus === 'fetching'` while a background refetch is running.
- A query with no data can have `status === 'pending'` and `fetchStatus === 'paused'` if fetching cannot start yet.

Use `status` when deciding whether data can be rendered, and use `fetchStatus` or `isFetching` when deciding whether to show a network activity indicator:

```marko
<if=todos.fetchStatus === "fetching">
  <span>Refreshing...</span>
</if>
```

To show one indicator for all queries, use `<is-fetching>`. It returns the number of queries that are fetching. Its optional `filters` function selects which queries to count:

```marko
<is-fetching/fetching/>
<is-fetching/fetchingTodos filters=() => ({ queryKey: ["todos"] })/>

<if=fetching>
  <span>Refreshing ${fetching} queries...</span>
</if>
```

## Reactive Query Options

The tag calls the `options` function again when the values that it reads change. Read the values that the query depends on inside the function:

```marko
export interface Input {
  userId: string;
}

<query/todos options=() => ({
  queryKey: ["todos", input.userId],
  queryFn: () => fetchTodos(input.userId),
  enabled: input.userId.length > 0,
})/>
```

The query key is used for caching, refetching, and sharing data between tags. When `input.userId` changes, the tag reads the query for the new key.

## Stale Data and Refetching

Cached data is **fresh** for `staleTime` milliseconds after the fetch that produced it, then **stale**. The default is `0`, so data is stale as soon as it arrives.

Becoming stale does not start a fetch. `staleTime` is a comparison against the time of the last fetch, not a timer that fires a request. A stale query that nothing touches keeps its cached data and makes no request.

Staleness decides whether a refetch happens, not when. These events ask for a refetch, and each one fetches only if the data is stale:

| Event                                            | Option                 | Default |
| ------------------------------------------------ | ---------------------- | ------- |
| A tag mounts, or a second tag reads the same key | `refetchOnMount`       | `true`  |
| The window regains focus                         | `refetchOnWindowFocus` | `true`  |
| The network reconnects                           | `refetchOnReconnect`   | `true`  |
| `invalidateQueries` marks the query stale        | —                      | —       |

Two cases ignore `staleTime`:

- A query with no cached data always fetches when a tag mounts, whatever `staleTime` is set to.
- `refetchInterval` fetches on its own timer, independent of `staleTime`. See [Polling](#polling).

A disabled query (`enabled: false`) does not fetch on any of these events. `refetch()` still works on it.

A query tag also stops fetching and stops receiving updates when it sets `subscribed: false`. The query itself stays enabled, so other tags on the same key keep fetching it. See [Rendering Without Subscribing](./parallel-queries.md#rendering-without-subscribing).

Set `staleTime` to `Infinity` to keep data fresh until `invalidateQueries` marks it stale. Set it to `'static'` to keep data fresh even then: `invalidateQueries` has no effect, and `refetchOnMount`, `refetchOnWindowFocus`, and `refetchOnReconnect` set to `'always'` are blocked too.

```marko
<query/todos options=() => ({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  staleTime: 60 * 1000,
})/>
```

## Refetching

The result includes `refetch`:

```marko
<button onClick() { todos.refetch() }>Refetch</button>
```

## Polling

Set `refetchInterval` to refetch on a timer. The value is in milliseconds, and `false` stops the timer:

```marko
<query/todos options=() => ({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  refetchInterval: 1000,
})/>
```

The tag keeps the last result while it polls, so the page does not return to its pending state on each tick. To pause polling from page state, make the value follow that state:

```marko
<let/paused=false>

<query/todos options=() => ({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  refetchInterval: paused ? false : 1000,
})/>
```

For multiple queries that should run at the same time, see [Parallel Queries](./parallel-queries.md).
