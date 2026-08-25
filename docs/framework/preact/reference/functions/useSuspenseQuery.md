---
id: useSuspenseQuery
title: useSuspenseQuery
---

```ts
function useSuspenseQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseSuspenseQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useSuspenseQuery.ts:51](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseQuery.ts#L51)

The options for `useSuspenseQuery` are the same as for `useQuery`, except for `throwOnError`, `enabled`, and
`placeholderData`.

Caveat: cancellation does not work.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

## Parameters

### options

[`UseSuspenseQueryOptions`](../interfaces/UseSuspenseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UseSuspenseQueryOptions](../interfaces/UseSuspenseQueryOptions.md) to use — the same options as `useQuery`, minus the ones listed above.

### queryClient?

`QueryClient`

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

[`UseSuspenseQueryResult`](../type-aliases/UseSuspenseQueryResult.md)\<`TData`, `TError`\>

The same object as `useQuery`, except that `data` is guaranteed to be defined, `isPlaceholderData`
is missing, and `status` is either `success` or `error` (with the derived flags set accordingly).

## Example

```tsx
import { Suspense } from 'preact/compat'
import { useSuspenseQuery } from '@tanstack/preact-query'

function Posts() {
  // `data` is guaranteed to be defined here — no `isPending` check needed.
  const { data, isFetching } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  return (
    <div>
      <h1>Posts {isFetching ? <Spinner /> : null}</h1>
      {data.map((post) => (
        <p key={post.id}>{post.title}</p>
      ))}
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<h1>Loading posts...</h1>}>
      <Posts />
    </Suspense>
  )
}
```
