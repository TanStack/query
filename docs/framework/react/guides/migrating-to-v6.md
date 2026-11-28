---
id: migrating-to-v6
title: Migrating to v6
---

## Client operations across frameworks

A `QueryClient` still owns the query cache, defaults, and subscriptions for one application. Import the operations your application needs from its framework adapter. Each operation takes the client first. Vue's exports also unwrap reactive keys and filters.

```ts
import {
  QueryClient,
  getQueryData,
  invalidateQueries,
  query,
} from '@tanstack/query-core'

const client = new QueryClient()
const posts = { queryKey: ['posts'], queryFn: fetchPosts }

await query(client, posts)
const cached = getQueryData(client, posts.queryKey)
await invalidateQueries(client, { queryKey: posts.queryKey })
```

| Earlier call                       | v6                                      |
| ---------------------------------- | --------------------------------------- |
| `client.query(options)`            | `query(client, options)`                |
| `client.infiniteQuery(options)`    | `infiniteQuery(client, options)`        |
| `client.setQueryData(key, update)` | `setQueryData(client, key, update)`     |
| `client.isFetching(filters)`       | `countFetchingQueries(client, filters)` |
| `client.getMutationCache()`        | `getMutationCache(client)`              |
| `cache.find(filters)`              | `findCachedQuery(cache, filters)`       |
| `entry.isActive()`                 | `isQueryActive(entry)`                  |

For framework-independent code, import these functions from `@tanstack/query-core`. A read-only client can operate for its entire lifetime without constructing a mutation cache. The first mutation or explicit call to `getMutationCache(client)` obtains the cache shared by later callers.

## Single queries in React and Preact

Choose the factory when defining the query. All four factories produce options that `useQuery` can read. TypeScript rejects a plain object passed directly to the hook.

| Subscriber               | Factory                        | Result                                                                          |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------------------- |
| Ordinary query           | `queryOptions`                 | Check the status to narrow data or error.                                       |
| Suspense query           | `suspenseQueryOptions`         | A running query returns defined data after the boundary resolves.               |
| Paginated query          | `infiniteQueryOptions`         | Receives the page data and pagination controls.                                 |
| Paginated Suspense query | `suspenseInfiniteQueryOptions` | Receives defined page data and pagination controls after the boundary resolves. |

```tsx
import {
  isLoadingError,
  isSuccess,
  queryOptions,
  useQuery,
} from '@tanstack/react-query'

const postQueryOptions = (id: number) =>
  queryOptions({ queryKey: ['post', id], queryFn: () => fetchPost(id) })

function Article({ id }: { id: number }) {
  const article = useQuery(postQueryOptions(id))
  if (isSuccess(article)) return <h1>{article.data.title}</h1>
  if (isLoadingError(article)) return <p>{article.error.message}</p>
  return <Spinner />
}
```

The checks narrow the original result, including the selected data type and the query's error type. An error during a background refresh can coexist with previously fetched data. Use `isRefetchError(result)` to distinguish that state.

```tsx
import { suspenseQueryOptions, useQuery } from '@tanstack/react-query'
import { Suspense } from 'react'

const postSuspenseOptions = (id: number) =>
  suspenseQueryOptions({ queryKey: ['post', id], queryFn: () => fetchPost(id) })

function ArticleTitle({ id }: { id: number }) {
  const { data } = useQuery(postSuspenseOptions(id))
  return <h1>{data.title}</h1>
}

function Article({ id }: { id: number }) {
  return (
    <Suspense fallback={<Spinner />}>
      <ArticleTitle id={id} />
    </Suspense>
  )
}
```

When the fetch function can be `skipToken`, a skipped Suspense reader can return cached data or `undefined`. For a list whose length changes, keep using `useQueries` or `useSuspenseQueries` so the component keeps a stable hook order.

## Optional query behavior

Import the helper where the feature is used, including when setting a client-wide default.

```ts
import {
  keepPreviousData,
  placeholderData,
  queryOptions,
  refetchInterval,
  select,
} from '@tanstack/react-query'

const catalogOptions = (page: number) =>
  queryOptions({
    queryKey: ['catalog', page],
    queryFn: () => fetchProducts(page),
    refetchInterval: refetchInterval(3000),
    placeholderData: placeholderData(keepPreviousData),
    select: select((products) => products.map((product) => product.title)),
  })
```

For ordinary React or Preact queries, pass `throwOnError: [throwOnError, true]` to opt into error boundaries. The second element can also be a predicate receiving the error and the cached query. Suspense factories handle initial fallback and errors through the boundary. Structural sharing remains enabled by default.

In an application that lazy loads a bookmarks panel, keep its mutation and pagination imports in the lazy module. An initial catalog read can then ship just the query reader. A bundler can still place functionality used by both routes into shared chunks.
