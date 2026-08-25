---
id: useSuspenseQueries
title: useSuspenseQueries
---

## Call Signature

```ts
function useSuspenseQueries<T, TCombinedResult>(options, queryClient?): TCombinedResult;
```

Defined in: [preact-query/src/useSuspenseQueries.ts:230](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseQueries.ts#L230)

The options for `useSuspenseQueries` are the same as for `useQueries`, except that each `query` can't have
`throwOnError`, `enabled`, or `placeholderData`.

### Type Parameters

#### T

`T` *extends* `any`[]

#### TCombinedResult

`TCombinedResult` = `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetUseSuspenseQueryResult`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseSuspenseQueryResult`\<`Head`\>, `GetUseSuspenseQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseSuspenseQueryResult`\<`Head`\>, `GetUseSuspenseQueryResult`\<`Head`\>, `GetUseSuspenseQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : \[`...{ [K in (...)]: (...) }[]`\] : \[...\{ \[K in string \| number \| symbol\]: GetUseSuspenseQueryResult\<Tails\[K\<(...)\>\]\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GetUseSuspenseQueryResult\<T\[K\<K\>\]\> \}

### Parameters

#### options

The `queries` array to run in Suspense, and an optional `combine` function.

##### combine?

(`result`) => `TCombinedResult`

Use this to combine the results of the queries into a single value. The result will be structurally
shared to be as referentially stable as possible.

##### queries

  \| readonly \[`T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetUseSuspenseQueryOptions`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseSuspenseQueryOptions`\<`Head`\>, `GetUseSuspenseQueryOptions`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : ...[] *extends* \[`...(...)[]`\] ? \[`...(...)[]`\] : ... *extends* ... ? ... : ... : `unknown`[] *extends* `T` ? `T` : `T` *extends* [`UseSuspenseQueryOptions`](../interfaces/UseSuspenseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] ? [`UseSuspenseQueryOptions`](../interfaces/UseSuspenseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] : [`UseSuspenseQueryOptions`](../interfaces/UseSuspenseQueryOptions.md)\<`unknown`, `Error`, `unknown`, readonly ...[]\>[]\]
  \| readonly \[\{ \[K in string \| number \| symbol\]: GetUseSuspenseQueryOptions\<T\[K\<K\>\]\> \}\]

An array with query option objects identical to `useSuspenseQuery`.

#### queryClient?

`QueryClient`

Use this to provide a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

### Returns

`TCombinedResult`

The same structure as `useQueries`, except that for each `query`, `data` is guaranteed to be
defined, `isPlaceholderData` is missing, and `status` is either `success` or `error` (with the derived
flags set accordingly).

Caveat: the component will only re-mount after all queries have finished loading. Hence, if a query has gone
stale in the time it took for all the queries to complete, it will be fetched again at re-mount. To avoid
this, make sure to set a high enough `staleTime`. Cancellation does not work.

### Example

```tsx
import { Suspense } from 'preact/compat'
import { useSuspenseQueries } from '@tanstack/preact-query'

function Posts({ ids }: { ids: Array<number> }) {
  // Every result is guaranteed to be defined — no per-query `isPending` check needed.
  const results = useSuspenseQueries({
    queries: ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
    })),
  })

  return (
    <ul>
      {results.map((result) => (
        <li key={result.data.id}>{result.data.title}</li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <Suspense fallback={<h1>Loading posts...</h1>}>
      <Posts ids={[1, 2, 3]} />
    </Suspense>
  )
}
```

## Call Signature

```ts
function useSuspenseQueries<T, TCombinedResult>(options, queryClient?): TCombinedResult;
```

Defined in: [preact-query/src/useSuspenseQueries.ts:297](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseQueries.ts#L297)

The options for `useSuspenseQueries` are the same as for `useQueries`, except that each `query` can't have
`throwOnError`, `enabled`, or `placeholderData`.

### Type Parameters

#### T

`T` *extends* `any`[]

#### TCombinedResult

`TCombinedResult` = `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetUseSuspenseQueryResult`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseSuspenseQueryResult`\<`Head`\>, `GetUseSuspenseQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseSuspenseQueryResult`\<`Head`\>, `GetUseSuspenseQueryResult`\<`Head`\>, `GetUseSuspenseQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : \[`...{ [K in (...)]: (...) }[]`\] : \[...\{ \[K in string \| number \| symbol\]: GetUseSuspenseQueryResult\<Tails\[K\<(...)\>\]\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GetUseSuspenseQueryResult\<T\[K\<K\>\]\> \}

### Parameters

#### options

The `queries` array to run in Suspense, and an optional `combine` function.

##### combine?

(`result`) => `TCombinedResult`

Use this to combine the results of the queries into a single value. The result will be structurally
shared to be as referentially stable as possible.

##### queries

readonly \[`T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetUseSuspenseQueryOptions`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseSuspenseQueryOptions`\<`Head`\>, `GetUseSuspenseQueryOptions`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...(...)[]`\] *extends* \[...\] ? \[..., ..., ...\] : ... *extends* ... ? ... : ... : `unknown`[] *extends* \[`...Tails[]`\] ? \[`...Tails[]`\] : \[`...(...)[]`\] *extends* ...[] ? ...[] : ...[] : `unknown`[] *extends* `T` ? `T` : `T` *extends* [`UseSuspenseQueryOptions`](../interfaces/UseSuspenseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] ? [`UseSuspenseQueryOptions`](../interfaces/UseSuspenseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] : [`UseSuspenseQueryOptions`](../interfaces/UseSuspenseQueryOptions.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]\]

An array with query option objects identical to `useSuspenseQuery`.

#### queryClient?

`QueryClient`

Use this to provide a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

### Returns

`TCombinedResult`

The same structure as `useQueries`, except that for each `query`, `data` is guaranteed to be
defined, `isPlaceholderData` is missing, and `status` is either `success` or `error` (with the derived
flags set accordingly).

Caveat: the component will only re-mount after all queries have finished loading. Hence, if a query has gone
stale in the time it took for all the queries to complete, it will be fetched again at re-mount. To avoid
this, make sure to set a high enough `staleTime`. Cancellation does not work.

### Example

```tsx
import { Suspense } from 'preact/compat'
import { useSuspenseQueries } from '@tanstack/preact-query'

function Posts({ ids }: { ids: Array<number> }) {
  // Every result is guaranteed to be defined — no per-query `isPending` check needed.
  const results = useSuspenseQueries({
    queries: ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
    })),
  })

  return (
    <ul>
      {results.map((result) => (
        <li key={result.data.id}>{result.data.title}</li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <Suspense fallback={<h1>Loading posts...</h1>}>
      <Posts ids={[1, 2, 3]} />
    </Suspense>
  )
}
```
