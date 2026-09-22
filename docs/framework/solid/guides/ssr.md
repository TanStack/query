---
id: ssr
title: SSR
---

This guide covers using Solid Query with server rendering, specifically with [SolidStart](https://start.solidjs.com/).

If you haven't already, it's worth reading the [Prefetching & Router Integration](./prefetching.md) guide first.

## Solid Query's hydration model

Solid Query's `useQuery` is built on top of Solid's own [`createResource`](https://docs.solidjs.com/reference/basic-reactivity/create-resource), rather than a `dehydrate`/`hydrate` pair you call yourself. That has a consequence for this guide: **there is no `dehydrate`, `hydrate`, or `HydrationBoundary` in your application code.**

Instead, when `useQuery` runs on the server:

1. It resolves the query through the same `QueryClient` cache a client render would use, with `retry` forced off and `throwOnError` forced on — see [Error handling](#error-handling) below.
2. The resolved value is a plain, serializable snapshot of the query result (functions like `refetch` are stripped, since they can't cross the network).
3. Solid's own resource streaming carries that snapshot down to the client — the same mechanism `createResource` uses for any async resource, query-related or not.
4. On the client, once the snapshot arrives, Solid Query hydrates the query cache from it internally, before your component ever sees a loading state for that query.

So the three steps you'd normally implement by hand — prefetch, dehydrate, hydrate — collapse into "call `useQuery` (or prefetch with `queryClient.query`), and let Solid's streaming take care of the rest." The tradeoff is that Solid Query decides what gets serialized and when, rather than you calling `dehydrate` with your own filtering logic.

One consequence worth calling out: a query that resolved on the server, and is read with a `staleTime` (or without `initialData`), does not refetch on mount when it hydrates on the client, since Solid Query already knows it has fresh-enough data from the server render. It behaves the same as any other successful query after that: `staleTime` governs whether it refetches on the next trigger (window focus, a new mount, `invalidateQueries`, and so on).

## Initial setup

As with any server-rendered app, create the `QueryClient` per request rather than at module scope, so cached data from one visitor's request is never shared with another's:

```tsx
// src/app.tsx
import { MetaProvider, Title } from '@solidjs/meta'
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { Suspense } from 'solid-js'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

export default function App() {
  // Constructing the QueryClient inside the component (rather than at module
  // scope) means SolidStart creates a fresh one for every request, so data
  // is never shared between users.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, a default staleTime above 0 avoids an immediate
        // background refetch as soon as the page hydrates on the client.
        staleTime: 5 * 1000,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <Router
        root={(props) => (
          <MetaProvider>
            <Title>My App</Title>
            <Suspense>{props.children}</Suspense>
          </MetaProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </QueryClientProvider>
  )
}
```

The `<Suspense>` boundary matters: `useQuery` suspends while a query is pending, both on the server (so SolidStart can wait for it, or stream past it) and on the client (during the very first render, before hydration data arrives).

## Using `useQuery` directly

Because hydration is automatic, the simplest way to get server-rendered data is to just call `useQuery` where you need it — no separate prefetch step required:

```tsx
import { useQuery } from '@tanstack/solid-query'
import { For, Suspense } from 'solid-js'

function Posts() {
  const query = useQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  }))

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ul>
        <For each={query.data}>{(post) => <li>{post.title}</li>}</For>
      </ul>
    </Suspense>
  )
}
```

On the server, this fetches `posts`, waits for it (because of the surrounding `<Suspense>`), and streams the resolved value down. On the client, that value hydrates the cache before `Posts` ever renders a loading state — as long as the client also renders inside a `<Suspense>` boundary, which the `<Suspense>` in `app.tsx` already provides.

Wrap the same query in Solid's `ErrorBoundary` to handle a failure. On the server, a failed query always throws to the nearest `ErrorBoundary` — see [Error handling](#error-handling) below for why, and for what it takes to get the same behavior on the client too:

```tsx
import { useQuery } from '@tanstack/solid-query'
import { ErrorBoundary, For, Suspense } from 'solid-js'

function Posts() {
  const query = useQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  }))

  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div>
          <div>Error: {err.message}</div>
          <button
            onClick={async () => {
              await query.refetch()
              reset()
            }}
          >
            Retry
          </button>
        </div>
      )}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <ul>
          <For each={query.data}>{(post) => <li>{post.title}</li>}</For>
        </ul>
      </Suspense>
    </ErrorBoundary>
  )
}
```

## Prefetching with `route.load`

To prefetch a query from a SolidStart route's `load` function, call `queryClient.query(...)`:

```tsx
import { noop, useQueryClient } from '@tanstack/solid-query'

export const route = {
  load: () => {
    const queryClient = useQueryClient()
    queryClient.query(postsQueryOptions()).catch(noop)
  },
}

export default function Posts() {
  const query = useQuery(() => postsQueryOptions())
  // ...
}
```

`.catch(noop)` keeps a failed prefetch from aborting routing — whatever reads the query afterwards (`useQuery`) will surface the failure on its own. See [Error handling](#error-handling) below for how that failure surfaces differently on the server and the client.

Sharing the query options object (`postsQueryOptions()` above) between `route.load` and the component that reads the data, rather than repeating the `queryKey`/`queryFn` in both places, keeps them from drifting apart — see [`queryOptions`](./query-options.md).

## Streaming with `deferStream`

By default, a query streams to the client as soon as it resolves on the server. Set `deferStream: true` to hold the server's response until that query resolves instead — useful for data that has to be present in the very first response, such as SEO meta tags:

```tsx
const query = useQuery(() => ({
  queryKey: ['user'],
  queryFn: fetchUser,
  deferStream: true,
}))
```

`deferStream` only affects when the *server* flushes that query's chunk to the client. Setting it on every query on a page makes the server wait for all of them before sending anything.

## Error handling

On the server, `useQuery` always throws when a query fails — regardless of the `throwOnError` option — so it's caught by the nearest `<ErrorBoundary>` rather than surfacing as `query.isError`. This is different from the client, where a failed query reports `isError`/`error` unless you opt in to throwing with `throwOnError: true`. Retries are also disabled on the server, so a query throws on its first failure rather than retrying first.

If a query is read with `useQuery` on both the server and the client, set `throwOnError: true` on it explicitly so the client matches what the server already does — otherwise the same failure throws during SSR but only sets `isError` once it's running on the client:

```tsx
const query = useQuery(() => ({
  queryKey: ['user'],
  queryFn: fetchUser,
  throwOnError: true,
}))
```

A `route.load` prefetch isn't affected by this server-only override — `queryClient.query(...)` doesn't take a `throwOnError` option at all, so it simply rejects when the query fails, the same on the server and the client. Catch it (or let it propagate) however fits the route; see [Prefetching with `route.load`](#prefetching-with-routeload) above for the `.catch(noop)` pattern used when a failed prefetch shouldn't abort routing.

## Tips, Tricks and Caveats

### Staleness is measured from when the query was fetched on the server

A query's staleness is based on `dataUpdatedAt`, which is set to when it resolved on the server, not when the client hydrates it. Because `staleTime` defaults to `0`, an SSR'd query without an explicit `staleTime` is treated as stale as soon as its next trigger (window focus, a new mount past the first one, `invalidateQueries`, and so on) checks it, and may refetch in the background then — the first mount on the client is still exempt, per [Solid Query's hydration model](#solid-querys-hydration-model) above. Setting a `staleTime` above `0` (as in the Initial setup example above) avoids this if you don't want it.

### High memory consumption on server

Because the `QueryClient` is created fresh for every request, its cache is held in memory for the duration of that request (and briefly after, for `gcTime`). Under high request volume this can add up. `gcTime` defaults to `Infinity` on the server, so unless you configure it lower, memory for a request's cache isn't reclaimed automatically — in most cases this is fine, since the whole `QueryClient` instance becomes eligible for garbage collection once the request finishes and nothing references it anymore.
