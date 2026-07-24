---
id: suspense
title: Suspense and Error Boundaries
---

Use `useSuspenseQuery`, `useSuspenseInfiniteQuery`, or
`useSuspenseQueries` when pending work should be handled by an Octane Suspense
boundary. These hooks integrate with Octane's `use(thenable)` behavior and
return results whose `data` is defined after the boundary resolves.

```tsrx
import { ErrorBoundary, Suspense } from 'octane'
import { useSuspenseQuery } from '@tanstack/octane-query'

function Profile() @{
  const profile = useSuspenseQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  })

  <h1>{profile.data.name}</h1>
}

function Page() @{
  <ErrorBoundary fallback={(error) => <p>{error.message}</p>}>
    <Suspense fallback={<p>{'Loading...'}</p>}>
      <Profile />
    </Suspense>
  </ErrorBoundary>
}
```

Octane's `@pending` and `@catch` directives can be used instead of the
component boundaries.

By default, a suspense query only throws an error when no cached data is
available. Set `throwOnError` on non-suspense queries or mutations when their
errors should reach the nearest error boundary.

Use `QueryErrorResetBoundary` or `useQueryErrorResetBoundary` to coordinate a
boundary retry with the Query cache. Reset the Query boundary when the Octane
error boundary retries so the failed query can fetch again instead of
immediately throwing the same error.
