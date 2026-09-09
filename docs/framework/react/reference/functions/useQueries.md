---
id: useQueries
title: useQueries
redirect_from:
  - framework/react/reference/useQueries
---

```ts
function useQueries<T, TCombinedResult>(__namedParameters, queryClient?): TCombinedResult;
```

Defined in: [packages/react-query/src/useQueries.ts:355](https://github.com/TanStack/query/blob/main/packages/react-query/src/useQueries.ts#L355)

The `useQueries` hook can be used to fetch a variable number of queries.

The `queries` key accepts an array with query option objects mostly identical to `useQuery` — the top-level
`subscribed` option isn't accepted per query (see `placeholderData` below for another difference). A custom
`QueryClient` is supplied once, as `useQueries`' own top-level second argument, rather than per query.

Having the same query key more than once in the array of query objects may cause some data to be shared
between queries. To avoid this, consider de-duplicating the queries and map the results back to the desired
structure.

The `combine` option can be used to combine the results of the queries into a single value. The result will
be structurally shared to be as referentially stable as possible.

## Type Parameters

### T

`T` *extends* `any`[]

### TCombinedResult

`TCombinedResult` = `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetUseQueryResult`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseQueryResult`\<`Head`\>, `GetUseQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseQueryResult`\<`Head`\>, `GetUseQueryResult`\<`Head`\>, `GetUseQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : \[`...{ [K in (...)]: (...) }[]`\] : \[...\{ \[K in string \| number \| symbol\]: GetUseQueryResult\<Tails\[K\<(...)\>\]\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GetUseQueryResult\<T\[K\<K\>\]\> \}

## Parameters

### \_\_namedParameters

#### combine?

(`result`) => `TCombinedResult`

Use this to combine the results of the queries into a single value. The result will be structurally
shared to be as referentially stable as possible.

#### queries

  \| readonly \[`T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetUseQueryOptionsForUseQueries`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseQueryOptionsForUseQueries`\<`Head`\>, `GetUseQueryOptionsForUseQueries`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : readonly ...[] *extends* \[`...(...)[]`\] ? \[`...(...)[]`\] : ... *extends* ... ? ... : ... : readonly `unknown`[] *extends* `T` ? `T` : `T` *extends* `UseQueryOptionsForUseQueries`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] ? `UseQueryOptionsForUseQueries`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] : `UseQueryOptionsForUseQueries`\<`unknown`, `Error`, `unknown`, readonly ...[]\>[]\]
  \| readonly \[\{ \[K in string \| number \| symbol\]: GetUseQueryOptionsForUseQueries\<T\[K\<K\>\]\> \}\]

An array with query option objects, mostly identical to `useQuery` — except that `queryClient` and
`subscribed` aren't accepted per-query (`subscribed` is a top-level option here instead), and
`placeholderData` accepts a [QueriesPlaceholderDataFunction](../type-aliases/QueriesPlaceholderDataFunction.md), which is called with `previousData`
and `previousQuery` always `undefined`, rather than `useQuery`'s placeholder function.

#### subscribed?

`boolean`

Set this to `false` to unsubscribe this observer from updates to the query cache.

**Default Value**

```ts
true
```

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to provide a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

## Returns

`TCombinedResult`

The combined result. Without `combine`, this is an array with all the query results, in the same
order as the input. When `combine` is provided, this is the value returned by `combine` instead.

## Remarks

The `combine` function only re-runs if it changed referentially, or if any of the query results
changed. An inlined `combine` function, as shown in the example below, therefore runs on every render — wrap
it in `useCallback`, or extract it to a stable function reference if it doesn't have any dependencies, to
avoid that.

Unlike `useQuery`, `useQueries` cannot infer the `data` argument of an _inline_ `select` from its sibling
`queryFn`. Because `useQueries` infers the type of the whole `queries` array at once, the `select` parameter
of a query object written inline cannot be contextually typed from that same object's `queryFn`, so it falls
back to `unknown` — a [known TypeScript limitation](https://github.com/TanStack/query/issues/6556). Annotate
the `select` parameter explicitly, or define the query with [queryOptions](queryOptions.md), which resolves its types in
a single object _before_ it reaches `useQueries`, to work around this — see the example below. The same
limitation applies to [useSuspenseQueries](useSuspenseQueries.md).

`placeholderData` is supported here too, but unlike `useQuery`, it doesn't receive information from
previously rendered queries, because the number of queries can differ between renders.

## Examples

```tsx
import { useQueries } from '@tanstack/react-query'

function Posts({ ids }: { ids: Array<number> }) {
  const postQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
      staleTime: Infinity,
    })),
  })

  return (
    <ul>
      {postQueries.map((query, index) => {
        if (query.isPending) return <li key={ids[index]}>Loading...</li>
        if (query.isError) return <li key={ids[index]}>Error: {query.error.message}</li>
        return <li key={ids[index]}>{query.data.title}</li>
      })}
    </ul>
  )
}
```

Combining results into a single value:
```tsx
import { useQueries } from '@tanstack/react-query'

function Posts({ ids }: { ids: Array<number> }) {
  const { data, isPending, isError } = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
    })),
    combine: (postQueries) => {
      return {
        data: postQueries.map((query) => query.data),
        isPending: postQueries.some((query) => query.isPending),
        isError: postQueries.some((query) => query.isError),
      }
    },
  })

  if (isPending) return 'Loading...'
  if (isError) return 'Error loading posts'

  return (
    <ul>
      {data.map((post) => (
        <li key={post?.id}>{post?.title}</li>
      ))}
    </ul>
  )
}
```

Typing `select` via [queryOptions](queryOptions.md). Note that spreading a `queryOptions` result and overriding
`select` inline still falls back to `unknown` — wrap the spread in `queryOptions` again so the override is
resolved before it reaches `useQueries`:
```tsx
import { queryOptions, useQueries } from '@tanstack/react-query'

const postOptions = (id: number) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

function PostTitle({ id }: { id: number }) {
  const [{ data: broken }] = useQueries({
    queries: [
      {
        ...postOptions(id),
        // ❌ `data` is `unknown` here
        select: (data) => data.title,
      },
    ],
  })

  const [{ data: fixed }] = useQueries({
    queries: [
      queryOptions({
        ...postOptions(id),
        // ✅ `data` is `Post`
        select: (data) => data.title,
      }),
    ],
  })

  return <h1>{fixed}</h1>
}
```
