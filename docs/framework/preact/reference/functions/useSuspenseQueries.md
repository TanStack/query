---
id: useSuspenseQueries
title: useSuspenseQueries
---

## Call Signature

```ts
function useSuspenseQueries<T, TCombinedResult>(options, queryClient?): TCombinedResult;
```

Defined in: [packages/preact-query/src/useSuspenseQueries.ts:409](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseQueries.ts#L409)

The options for `useSuspenseQueries` are the same as for `useQueries`, except that the top-level `subscribed`
option isn't supported, and each `query` can't have `throwOnError`, `enabled`, or `placeholderData`.

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

[`QueryClient`](../classes/QueryClient.md)

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

### Examples

The query error is thrown if a fetch fails and no cached data exists yet, so an error boundary is
required around `<Suspense>`. A failed background refetch instead continues to render the cached data.
Use [QueryErrorResetBoundary](QueryErrorResetBoundary.md) to let the user retry after such an error:
```tsx
import { Suspense } from 'preact/compat'
import { useErrorBoundary } from 'preact/hooks'
import {
  QueryErrorResetBoundary,
  useSuspenseQueries,
} from '@tanstack/preact-query'
import type { ComponentChildren } from 'preact'

function Posts({ ids }: { ids: Array<number> }) {
  // Every result is guaranteed to be defined — no per-query `isPending` check needed.
  const postQueries = useSuspenseQueries({
    queries: ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
    })),
  })

  return (
    <ul>
      {postQueries.map((query) => (
        <li key={query.data.id}>{query.data.title}</li>
      ))}
    </ul>
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
            <Posts ids={[1, 2, 3]} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function ErrorBoundary({
  children,
  onReset,
  fallbackRender,
}: {
  children: ComponentChildren
  onReset: () => void
  fallbackRender: (props: {
    error: Error
    resetErrorBoundary: () => void
  }) => ComponentChildren
}) {
  const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())

  if (error) return fallbackRender({ error, resetErrorBoundary })

  return children
}
```

Several different queries — use `useSuspenseQueries` instead of multiple `useSuspenseQuery` calls, so
they fetch in parallel rather than suspending one after another:
```tsx
import { Suspense } from 'preact/compat'
import { useErrorBoundary } from 'preact/hooks'
import {
  QueryErrorResetBoundary,
  useSuspenseQueries,
} from '@tanstack/preact-query'
import type { ComponentChildren } from 'preact'

function Dashboard() {
  const [usersQuery, teamsQuery, projectsQuery] = useSuspenseQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['teams'], queryFn: fetchTeams },
      { queryKey: ['projects'], queryFn: fetchProjects },
    ],
  })

  return (
    <div>
      <UserList users={usersQuery.data} />
      <TeamList teams={teamsQuery.data} />
      <ProjectList projects={projectsQuery.data} />
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
          <Suspense fallback={<h1>Loading dashboard...</h1>}>
            <Dashboard />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function ErrorBoundary({
  children,
  onReset,
  fallbackRender,
}: {
  children: ComponentChildren
  onReset: () => void
  fallbackRender: (props: {
    error: Error
    resetErrorBoundary: () => void
  }) => ComponentChildren
}) {
  const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())

  if (error) return fallbackRender({ error, resetErrorBoundary })

  return children
}
```

`combine`s the results into a single boolean, so `Refresh` only re-renders when that boolean changes,
not on every individual query update. This overload is the only one that accepts `combine`:
```tsx
import { Suspense } from 'preact/compat'
import { useErrorBoundary } from 'preact/hooks'
import {
  QueryErrorResetBoundary,
  useSuspenseQueries,
} from '@tanstack/preact-query'
import type { ComponentChildren } from 'preact'

function Refresh() {
  const anyFetching = useSuspenseQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['teams'], queryFn: fetchTeams },
    ],
    combine: (results) => results.some((result) => result.isFetching),
  })

  return anyFetching ? <span>Refreshing…</span> : null
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
          <Suspense fallback={<h1>Loading dashboard...</h1>}>
            <Refresh />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function ErrorBoundary({
  children,
  onReset,
  fallbackRender,
}: {
  children: ComponentChildren
  onReset: () => void
  fallbackRender: (props: {
    error: Error
    resetErrorBoundary: () => void
  }) => ComponentChildren
}) {
  const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())

  if (error) return fallbackRender({ error, resetErrorBoundary })

  return children
}
```

## Call Signature

```ts
function useSuspenseQueries<T, TCombinedResult>(options, queryClient?): TCombinedResult;
```

Defined in: [packages/preact-query/src/useSuspenseQueries.ts:589](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseQueries.ts#L589)

The options for `useSuspenseQueries` are the same as for `useQueries`, except that the top-level `subscribed`
option isn't supported, and each `query` can't have `throwOnError`, `enabled`, or `placeholderData`.

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

[`QueryClient`](../classes/QueryClient.md)

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

### Examples

The query error is thrown if a fetch fails and no cached data exists yet, so an error boundary is
required around `<Suspense>`. A failed background refetch instead continues to render the cached data.
Use [QueryErrorResetBoundary](QueryErrorResetBoundary.md) to let the user retry after such an error:
```tsx
import { Suspense } from 'preact/compat'
import { useErrorBoundary } from 'preact/hooks'
import {
  QueryErrorResetBoundary,
  useSuspenseQueries,
} from '@tanstack/preact-query'
import type { ComponentChildren } from 'preact'

function Posts({ ids }: { ids: Array<number> }) {
  // Every result is guaranteed to be defined — no per-query `isPending` check needed.
  const postQueries = useSuspenseQueries({
    queries: ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
    })),
  })

  return (
    <ul>
      {postQueries.map((query) => (
        <li key={query.data.id}>{query.data.title}</li>
      ))}
    </ul>
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
            <Posts ids={[1, 2, 3]} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function ErrorBoundary({
  children,
  onReset,
  fallbackRender,
}: {
  children: ComponentChildren
  onReset: () => void
  fallbackRender: (props: {
    error: Error
    resetErrorBoundary: () => void
  }) => ComponentChildren
}) {
  const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())

  if (error) return fallbackRender({ error, resetErrorBoundary })

  return children
}
```

Several different queries — use `useSuspenseQueries` instead of multiple `useSuspenseQuery` calls, so
they fetch in parallel rather than suspending one after another:
```tsx
import { Suspense } from 'preact/compat'
import { useErrorBoundary } from 'preact/hooks'
import {
  QueryErrorResetBoundary,
  useSuspenseQueries,
} from '@tanstack/preact-query'
import type { ComponentChildren } from 'preact'

function Dashboard() {
  const [usersQuery, teamsQuery, projectsQuery] = useSuspenseQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['teams'], queryFn: fetchTeams },
      { queryKey: ['projects'], queryFn: fetchProjects },
    ],
  })

  return (
    <div>
      <UserList users={usersQuery.data} />
      <TeamList teams={teamsQuery.data} />
      <ProjectList projects={projectsQuery.data} />
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
          <Suspense fallback={<h1>Loading dashboard...</h1>}>
            <Dashboard />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function ErrorBoundary({
  children,
  onReset,
  fallbackRender,
}: {
  children: ComponentChildren
  onReset: () => void
  fallbackRender: (props: {
    error: Error
    resetErrorBoundary: () => void
  }) => ComponentChildren
}) {
  const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())

  if (error) return fallbackRender({ error, resetErrorBoundary })

  return children
}
```
