---
id: useQueries
title: useQueries
---

```ts
function useQueries<T, TCombinedResult>(__namedParameters, queryClient?): TCombinedResult;
```

Defined in: [packages/preact-query/src/useQueries.ts:302](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQueries.ts#L302)

The `useQueries` hook can be used to fetch a variable number of queries.

The `queries` key accepts an array with query option objects mostly identical to `useQuery` — see the
`queries` parameter below for the differences. A custom `QueryClient` is supplied once, as `useQueries`' own
top-level second argument, rather than per query.

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

## Examples

```tsx
import { useQueries } from '@tanstack/preact-query'

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
import { useQueries } from '@tanstack/preact-query'

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
