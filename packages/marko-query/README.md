# @tanstack/marko-query

Marko adapter for `@tanstack/query-core`. It re-exports core and adds tags
for queries, mutations and hydration. It creates a query client for each server
request and for the page in the browser.

This package is currently experimental. Pin an exact version if you use it in
production while the API is early.

## Install

```sh
npm install @tanstack/marko-query
```

The Marko compiler finds the tags through the `marko.json` of the package.

## Quick start

Prefetch on the server with the methods of core. Then read the query in a
template. This example uses Marko Run. Any code that has the `$global` of the
render works.

```ts
// queries.ts
import { queryOptions } from '@tanstack/marko-query'

export const todosQuery = queryOptions({
  queryKey: ['todos'],
  queryFn: listTodos,
})
```

```ts
// +handler.ts
import { getQueryClient, noop } from '@tanstack/marko-query'
import { todosQuery } from './queries.ts'

export const GET = Run.GET(async (ctx, next) => {
  await getQueryClient(ctx).query(todosQuery).catch(noop)
  return next()
})
```

```marko
import { todosQuery } from "./queries.ts";

<query/todos options=() => todosQuery/>

<if=todos.data>
  <todo-list todos=todos.data/>
  <button onClick() { todos.refetch() }>Refresh</button>
</if>
<else-if=todos.error>${todos.error.message}</else-if>
```

`todos` is the result of the observer, with its methods. The browser starts
from what the server rendered. It does not fetch again while the data is fresh.

## Tags

| Tag                      | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `<query>`                | Reads a query. Returns the query result.              |
| `<infinite-query>`       | Reads an infinite query. Returns the infinite result. |
| `<queries>`              | Reads several queries. Returns an array of results.   |
| `<mutation>`             | Returns `mutate`, `mutateAsync`, `reset` and state.   |
| `<is-fetching>`          | Returns the number of fetching queries.               |
| `<is-mutating>`          | Returns the number of pending mutations.              |
| `<mutation-state>`       | Returns an array of mutation states.                  |
| `<hydration-boundary>`   | Hydrates dehydrated state, then renders its content.  |
| `<query-client-factory>` | Configures every client that the adapter creates.     |

`options`, `filters` and `client` are functions, for example
`options=() => todosQuery`. The function runs again when the values it reads
change. `<queries>` returns what `combine` returns, if you set it.

Every tag except `<query-client-factory>` takes `client=() => myClient`, to use
a client other than the one for this `$global`.

## The client

- On the server, `getQueryClient($global)` returns the client of the current
  request. In Marko Run, pass the request context. Requests never share a
  client.
- In the browser, `getQueryClient($global)` returns the client of the page. It
  hydrates the client once from the state that the server put on `$global`.

To configure every client, render `<query-client-factory>` once, in the root
layout:

```marko
// src/routes/+layout.marko
import { createQueryClient } from "../lib/query-client.ts";

<query-client-factory factory=createQueryClient/>
```

`factory` must be a function that you import. The transform registers it in the
layout's module in both environments, so it is in effect when the server
evaluates that module — before any handler, middleware, or render of the first
request, because loading a route loads the layout with it — and when the browser
evaluates the page bundle, which is before Marko mounts anything. Route handlers
that prefetch already use it, and so does the first query tag. In the browser, a
factory that arrives after the page already has a client (the tag rendered below
a query tag) logs a development warning and applies to the clients created
after it. To use a client that you created yourself, call
`setQueryClient(client, $global)`.

`setQueryClient(client)` replaces the client of the page. Every mounted tag that
follows the client of the page reconnects to the new one, so its result and its
subscription move with it. A tag that you gave its own `client` input keeps
observing that client. The reconnect happens in the same tick as the call, so a
tag never observes the old client after `setQueryClient` returns.

The factory is stored once per process, so every root that one server process
renders must use the same factory. Two layouts with different factories do not
coexist: the layout module evaluated last wins, and every later request uses its
factory, including requests for the other root. The browser is not affected,
because each page bundle contains the layout of its own root. A server that must
give one root different options pins a client for the request with
`setQueryClient(client, $global)` in that root's middleware, before anything
reads the client; the pin belongs to that request and is not affected by a
factory that registers later.

## Server rendering

The server sends the cache of the request client to the browser through
`$global.dehydratedQueryState`. Each query tag also sends the entries it
rendered, so content that streams later, for example inside `<await>`, is
included.

To hydrate state from another source, such as a loader, use
`<hydration-boundary state=dehydratedState>`. Its content renders after the
state is hydrated.

A paused mutation is hydrated once per client, even when the same state also
arrives through `$global` or is passed again on a later render. Core `hydrate`
always adds a new `Mutation`, so the boundary filters the ones the client
already has, by state object identity and by `mutationKey` plus `submittedAt`.
Mutations without a `mutationKey` are matched by identity only.

`throwOnError` throws during render, so the nearest `<try>` catches it. That
includes an error that is `undefined`: the tag carries the throw request as a
wrapper (`{ error }`), so a `queryFn` that calls `Promise.reject()` reaches
`<@catch>` instead of being treated as success.

## Subscribing

`<query>`, `<infinite-query>` and `<queries>` take `subscribed`, `true` by
default. With `subscribed: false` the tag reads the result once and then stops:
no fetch starts, and no later cache update reaches the tag. The query stays
enabled and other tags on the same key still fetch it, so this is a property of
the tag, not of the query.

```marko
<query/todos options=() => ({ ...todosQuery, subscribed: false })/>
```

`<queries>` takes one flag for the whole tag, so it is not accepted inside an
entry of `queries`. A tag that does not subscribe reports the cache's real
`fetchStatus`: an uncached query shows `idle` rather than a fetch that never
starts.

`examples/marko/basic` renders two tags on one key at `/subscribed`, one of them
frozen, so the difference is visible.

## Devtools

See [`@tanstack/marko-query-devtools`](../marko-query-devtools).

## Documentation

Visit
[the Marko Query docs](https://tanstack.com/query/latest/docs/framework/marko/overview)
for guides. The core APIs are documented in the TanStack Query Core reference.
