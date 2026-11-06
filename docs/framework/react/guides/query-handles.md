---
id: query-handles
title: Query Handles (experimental)
---

> These APIs are experimental. Their names start with `experimental_`, and they can change in a minor release.

A route loader or Server Component knows which data a page needs before the page renders. Query handles let it start those queries early and pass small references to the components that read them, so the components don't repeat the query's options.

A handle is a plain object with the query's key and its input. It is serializable, so a loader or Server Component can return it.

## Query factories

Handles come from query factories: functions of one input (or none) that return query options.

[//]: # 'Factories'

```tsx
import { queryOptions } from '@tanstack/react-query'

export const postQuery = (input: { id: string }) =>
  queryOptions({
    queryKey: ['post', input.id] as const,
    queryFn: () => fetchPost(input.id),
    staleTime: 60 * 1000,
  })

export const viewerQuery = () =>
  queryOptions({
    queryKey: ['viewer'] as const,
    queryFn: fetchViewer,
  })
```

[//]: # 'Factories'

A handle's type comes from its factory's key. Declare keys with `as const`: two factories with the same input and data then still produce different handle types, and passing one factory's handle to another is a type error.

## Starting queries

Three functions start a query and return its handle. They take the `QueryClient` first, then the factory, then the factory's input:

| Function                         | Waits for                     |
| -------------------------------- | ----------------------------- |
| `experimental_queryHandle`       | nothing                       |
| `experimental_queryHandleAsync`  | fresh data                    |
| `experimental_ensureQueryHandle` | any data, even if it is stale |

At runtime, all three return the same plain `{ queryKey, input }` handle, without the query's data. In types, the two awaited functions return an `experimental_DefinedQueryHandle`: when it resolves, the cache has the query's data, so `experimental_getQueryHandleData` can read it.

`experimental_queryHandle` and `experimental_queryHandleAsync` use the query's `staleTime` like `queryClient.query`: they start a fetch only when the cache has no fresh data.

`experimental_queryHandle` doesn't wait and doesn't reject: fetch errors show up where a component reads the handle. The other two reject when the fetch they wait for fails, so a loader can redirect or show an error page.

[//]: # 'Loader'

```tsx
import {
  experimental_queryHandle,
  experimental_queryHandleAsync,
} from '@tanstack/react-query'

export async function loader({ params }) {
  return {
    // Start the post without waiting, and stream it in
    post: experimental_queryHandle(queryClient, postQuery, {
      id: params.id,
    }),
    // The page can't render without the viewer, so wait for it
    viewer: await experimental_queryHandleAsync(queryClient, viewerQuery),
  }
}
```

[//]: # 'Loader'

### Using cached data, even if stale

`experimental_ensureQueryHandle` is the handle version of `queryClient.query` with `staleTime: 'static'`, which [replaces the deprecated `ensureQueryData`](./prefetching.md#using-query-to-prefetch). If the cache has data, even stale data, it resolves at once without fetching. If not, it fetches once and waits:

[//]: # 'EnsureData'

```tsx
import { experimental_ensureQueryHandle } from '@tanstack/react-query'

export async function loader({ params }) {
  return {
    // If we have the post loaded already, we don't want to block on a refetch.
    // Otherwise wait for it, and throw if it fails
    post: await experimental_ensureQueryHandle(queryClient, postQuery, {
      id: params.id,
    }),
  }
}
```

[//]: # 'EnsureData'

The loader doesn't refetch stale data. The component that reads the handle does: it uses the factory's `staleTime`, so it refetches stale data in the background when it mounts.

### Reading awaited data in a loader

Sometimes the loader needs the data itself, for example to throw `notFound()` when a post doesn't exist. `experimental_getQueryHandleData(queryClient, factory, handle)` reads it from the cache. It takes only handles from `experimental_queryHandleAsync` and `experimental_ensureQueryHandle`, which wait for data. Passing a handle from `experimental_queryHandle` is a type error, because its query may not have data yet.

[//]: # 'LoaderData'

```tsx
import {
  experimental_getQueryHandleData,
  experimental_queryHandle,
  experimental_queryHandleAsync,
} from '@tanstack/react-query'

export async function loader({ params }) {
  // Start the viewer first, so it loads while the loader waits for the post
  const viewer = experimental_queryHandle(queryClient, viewerQuery)
  const post = await experimental_queryHandleAsync(queryClient, postQuery, {
    id: params.id,
  })
  if (!experimental_getQueryHandleData(queryClient, postQuery, post)) {
    throw notFound()
  }
  return { viewer, post }
}
```

[//]: # 'LoaderData'

> [!WARNING]
> Use the data for decisions in the loader, like throwing `notFound()` or redirecting. Don't build other queries' inputs from it: those queries would wait for this one, which is a waterfall. Start independent handles before you await.

`experimental_getQueryHandleData` never fetches, waits or creates a query. It returns what the factory's `select` returns, or else the `queryFn`'s data.

### Pitfalls

**Awaiting one handle after another.** Each `await` waits for its query before the next one starts:

[//]: # 'SequentialAwaits'

```tsx
// The viewer starts only after the post has loaded
const post = await experimental_ensureQueryHandle(queryClient, postQuery, {
  id,
})
const viewer = await experimental_queryHandleAsync(queryClient, viewerQuery)
```

[//]: # 'SequentialAwaits'

Await them together instead:

[//]: # 'PromiseAll'

```tsx
const [post, viewer] = await Promise.all([
  experimental_ensureQueryHandle(queryClient, postQuery, { id }),
  experimental_queryHandleAsync(queryClient, viewerQuery),
])
```

[//]: # 'PromiseAll'

For named results, define a small `allKeyed`. It mirrors [`Promise.allKeyed`](https://github.com/tc39/proposal-await-dictionary), a Stage 3 TC39 proposal, without patching `Promise`:

[//]: # 'PromiseAllKeyed'

```tsx
async function allKeyed<T extends Record<string, unknown>>(
  record: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(record)
  const values = await Promise.all(keys.map((key) => record[key]))
  return Object.fromEntries(keys.map((key, i) => [key, values[i]])) as any
}

const { post, viewer } = await allKeyed({
  post: experimental_ensureQueryHandle(queryClient, postQuery, { id }),
  viewer: experimental_queryHandleAsync(queryClient, viewerQuery),
})
```

[//]: # 'PromiseAllKeyed'

**Starting a handle after an await.** `experimental_queryHandle` doesn't wait, but it only starts when the loader reaches it, and after an `await` that is late. Start every handle before the first `await`.

**Building another query's input from awaited data.** See the warning in [Reading awaited data in a loader](#reading-awaited-data-in-a-loader).

## Reading handles

`experimental_fromHandle(factory, handle)` rebuilds the query's options from its handle. Pass them to `useQuery`, `useSuspenseQuery`, `useSuspenseInfiniteQuery` or any other API that takes query options, and spread them to add read-site options like `select`:

[//]: # 'Reading'

```tsx
import {
  experimental_fromHandle,
  useSuspenseQuery,
  type experimental_QueryHandle,
} from '@tanstack/react-query'

function Post(props: { post: experimental_QueryHandle<typeof postQuery> }) {
  const { data } = useSuspenseQuery({
    ...experimental_fromHandle(postQuery, props.post),
    select: (post) => post.title,
  })
  return <h1>{data}</h1>
}
```

[//]: # 'Reading'

The factory types `select`'s argument, as with any `queryOptions` result. A `select` in the factory works too: readers get the selected type, and a read-site `select` replaces it. Keep options that decide how the query fetches or how long its data stays fresh, like `queryFn` or `staleTime`, on the factory, so the loader and the component agree on them.

Readers get the query's data from the cache. To get defined `data`, read the handle with `useSuspenseQuery`, which waits for the data. To type a prop that takes that data, use `experimental_InferQueryHandleData<typeof postQuery>`, which gives the same type as `useSuspenseQuery`'s `data`. `useQuery` types `data` as possibly `undefined`, as usual, even for a handle a loader waited for: the cache may have lost the data since, for example after `queryClient.clear()`.

## Waterfalls: `experimental_waterfallHandle`

Sometimes you only know the input during render, like a search term, a page a user clicks to, or an id in another query's data. `experimental_waterfallHandle` builds the handle for such an input. It doesn't start the query: the component that reads the handle does, when it renders. That makes it a [request waterfall](./request-waterfalls.md), and the name keeps that visible. It is a plain function, not a hook, so you can call it anywhere.

Pass it an input:

[//]: # 'WaterfallInput'

```tsx
function Search(props: { term: string }) {
  const results = experimental_waterfallHandle(searchQuery, {
    term: props.term,
  })
  const { data } = useQuery(experimental_fromHandle(searchQuery, results))
}
```

[//]: # 'WaterfallInput'

When the input comes from another query's data, the dependency is real: the author's other posts can't start until the post's data arrives. Start the dependent query in the component that has that data:

[//]: # 'WaterfallDependent'

```tsx
function MorePosts(props: {
  post: experimental_QueryHandle<typeof postQuery>
}) {
  const { data: post } = useSuspenseQuery(
    experimental_fromHandle(postQuery, props.post),
  )
  const authorPosts = experimental_waterfallHandle(authorPostsQuery, {
    authorId: post.authorId,
  })
  const { data } = useQuery(
    experimental_fromHandle(authorPostsQuery, authorPosts),
  )
}
```

[//]: # 'WaterfallDependent'

Most pages don't need this. Put the input in the URL, or have the post's query return what the page needs, so the loader can start everything at once.

Or switch a handle a loader passed down to a new input:

[//]: # 'WaterfallSwitch'

```tsx
function Posts(props: { posts: experimental_QueryHandle<typeof postsQuery> }) {
  const [page, setPage] = React.useState(props.posts.input.page)
  const posts = experimental_waterfallHandle(
    postsQuery,
    props.posts,
    (input) => ({
      ...input,
      page,
    }),
  )
  const { data } = useQuery({
    ...experimental_fromHandle(postsQuery, posts),
    placeholderData: keepPreviousData,
  })
}
```

[//]: # 'WaterfallSwitch'

`page` starts from the handle's input, so the first render reads the query the loader started instead of fetching another page. While the switched input maps to the handle's own query, it returns that handle as is, so the first page reads what the loader started. That also keeps the old input when only fields outside the key change, so put everything the `queryFn` reads in the key. Prefer putting such inputs in the URL so the loader can start them, and use `experimental_waterfallHandle` when that isn't practical.

The query starts when its reader renders, like any other `useQuery` or `useSuspenseQuery`. `useQuery` doesn't fetch during a server render, while `useSuspenseQuery` does.

## Server rendering

Queries you start with handles work with the [hydration APIs](./advanced-ssr.md) like any other query.

### Streaming pending queries

`dehydrate` only includes successful queries by default. To stream a query that `experimental_queryHandle` started and that is still pending, opt in through `shouldDehydrateQuery`. A pending query dehydrates to a promise, so the page needs a transport that can send promises, like React Server Components, TanStack Start or React Router:

[//]: # 'DehydratePending'

```tsx
import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    dehydrate: {
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
    },
  },
})
```

[//]: # 'DehydratePending'

### Server `staleTime`

Queries started on the server follow the same `staleTime` rules as in the browser. The data a server render sends along is as old as the server fetch, and when the browser reads it, a query with the default `staleTime: 0` already counts as stale. The component that reads it refetches on mount, so each request runs twice: once on the server and once in the browser.

[//]: # 'StaleTimeDoubleFetch'

```tsx
const postQuery = (input: { id: string }) =>
  queryOptions({
    queryKey: ['post', input.id] as const,
    queryFn: () => fetchPost(input.id),
    // No staleTime: it defaults to 0
  })

// On the server: fetches the post, and sends it along with the page
const post = await experimental_queryHandleAsync(queryClient, postQuery, { id })

// In the browser: the post is already stale, so this fetches it again on mount
const { data } = useQuery(experimental_fromHandle(postQuery, post))
```

[//]: # 'StaleTimeDoubleFetch'

The fix is a `staleTime` above 0, either on the factory or as a default of the `QueryClient`. Pick one that covers the time between the server fetch and the browser's first render:

[//]: # 'StaleTimeFix'

```tsx
const postQuery = (input: { id: string }) =>
  queryOptions({
    queryKey: ['post', input.id] as const,
    queryFn: () => fetchPost(input.id),
    staleTime: 60 * 1000,
  })

// Or, for every query:
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
})
```

[//]: # 'StaleTimeFix'

Set `staleTime` on the factory rather than at the read site, so the server and the browser use the same value.

### Nested dehydration without sending a query twice

With Server Components, each component that starts queries can render its own `HydrationBoundary`. When two of them share a query, both dehydrate it, and the page sends its data twice. To send each query once per request, track the hashes of the queries you've already sent and skip them in `shouldDehydrateQuery`.

The tracker must belong to one request. Create it with the request's `QueryClient`, or with React's `cache()` in Server Components, which gives each request its own copy:

[//]: # 'NestedDehydrate'

```tsx
// app/get-query-client.ts
import { cache } from 'react'
import {
  QueryClient,
  defaultShouldDehydrateQuery,
  dehydrate,
} from '@tanstack/react-query'

export const getQueryClient = cache(
  () =>
    new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000 } } }),
)

// One set per request, like the QueryClient
const getSentQueryHashes = cache(() => new Set<string>())

export function dehydrateUnsent() {
  const sent = getSentQueryHashes()
  return dehydrate(getQueryClient(), {
    shouldDehydrateQuery: (query) => {
      if (sent.has(query.queryHash)) return false
      const include =
        defaultShouldDehydrateQuery(query) || query.state.status === 'pending'
      if (include) sent.add(query.queryHash)
      return include
    },
  })
}
```

[//]: # 'NestedDehydrate'

Outside Server Components, key the tracker by the request's client, for example with a `WeakMap<QueryClient, Set<string>>`, or create it next to the client in your request handler.

Don't create the tracker at module level:

[//]: # 'NestedDehydrateDont'

```tsx
// Don't do this: one set for every request the server handles
const sent = new Set<string>()

export function dehydrateUnsent(queryClient: QueryClient) {
  return dehydrate(queryClient, {
    shouldDehydrateQuery: (query) => {
      if (sent.has(query.queryHash)) return false
      sent.add(query.queryHash)
      return true
    },
  })
}
```

[//]: # 'NestedDehydrateDont'

Every request the server handles shares the module. Once one request has sent a query, every later request for any user skips it, so their pages arrive without its data and fetch it again in the browser. The set also grows for as long as the server runs.

Each query goes out once, with the state it has when `dehydrate` first includes it. If it changes later in the same request, the change doesn't reach the browser.
