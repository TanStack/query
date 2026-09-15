---
id: useSuspenseQuery
title: useSuspenseQuery
redirect_from:
  - framework/react/reference/useSuspenseQuery
---

```ts
function useSuspenseQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseSuspenseQueryResult<TData, TError>;
```

Defined in: [packages/react-query/src/useSuspenseQuery.ts:75](https://github.com/TanStack/query/blob/main/packages/react-query/src/useSuspenseQuery.ts#L75)

The options for `useSuspenseQuery` are the same as for `useQuery`, except for `throwOnError`, `enabled`, and
`placeholderData` — and `queryFn` may not be `skipToken`, since Suspense hooks can't render a "disabled" state.

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

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

[`UseSuspenseQueryResult`](../type-aliases/UseSuspenseQueryResult.md)\<`TData`, `TError`\>

The same object as `useQuery`, except that `data` is guaranteed to be defined, `isPlaceholderData`
is missing, and `status` is either `success` or `error` (with the derived flags set accordingly).

## Remarks

Multiple `useSuspenseQuery` calls in the same component suspend serially, causing a request
waterfall — each one blocks rendering until it resolves, so the next doesn't even start fetching until then.
Use [useSuspenseQueries](useSuspenseQueries.md) instead when you have more than one suspenseful query in a component, so they
fetch in parallel.

## Example

The query error is thrown if the fetch fails and no cached data exists yet, so an error boundary is
required around `<Suspense>`. A failed background refetch instead continues to render the cached data.
Use [QueryErrorResetBoundary](QueryErrorResetBoundary.md) to let the user retry after such an error:
```tsx
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query'

function Posts() {
  // `data` is guaranteed to be defined here — no `isPending` check needed.
  const { data, isFetching } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  return (
    <div>
      <h1>Posts {isFetching ? '(refreshing...)' : null}</h1>
      <ul>
        {data.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div>
              There was an error!
              <button onClick={() => resetErrorBoundary()}>Try again</button>
            </div>
          )}
        >
          <Suspense fallback={<h1>Loading posts...</h1>}>
            <Posts />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
```
