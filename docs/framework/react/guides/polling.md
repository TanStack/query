---
id: polling
title: Polling
---

`refetchInterval` makes a query refetch on a timer. Set it to a number in milliseconds and the query runs every N ms while there's at least one active observer:

[//]: # 'Example1'

```tsx
useQuery({
  queryKey: ['prices'],
  queryFn: fetchPrices,
  refetchInterval: 5_000, // every 5 seconds
})
```

[//]: # 'Example1'

Polling is independent of `staleTime`. A query can be fresh and still poll on schedule — `staleTime` controls when background refetches triggered by *mounting* or *window focus* happen. `refetchInterval` fires on its own clock regardless.

## Adapting the interval to query state

Pass a function instead of a number to compute the interval from the current query. The function receives the `Query` object and should return a number in ms or `false` to stop polling:

[//]: # 'Example2'

```tsx
useQuery({
  queryKey: ['job', jobId],
  queryFn: () => fetchJobStatus(jobId),
  refetchInterval: (query) => {
    // Stop polling once the job finishes
    if (query.state.data?.status === 'complete') return false
    return 2_000
  },
})
```

[//]: # 'Example2'

Returning `false` clears the interval timer. If the query result changes so the function would return a positive number again, polling resumes automatically.

## Background polling

By default, polling pauses when the browser tab loses focus. For dashboards or any interface where data needs to stay current even while the user is in another tab, disable that behavior:

[//]: # 'Example3'

```tsx
useQuery({
  queryKey: ['portfolio'],
  queryFn: fetchPortfolio,
  refetchInterval: 30_000,
  refetchIntervalInBackground: true,
})
```

[//]: # 'Example3'

## Disabling window-focus refetching in non-browser UIs

In a fullscreen game, kiosk app, or any UI where the window is always technically "active," focus events don't map to user intent. Relying on them for freshness typically causes a burst of requests whenever the user alt-tabs.

Disable focus-based refetching globally and use `refetchInterval` instead:

[//]: # 'Example4'

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchInterval: 60_000,
    },
  },
})
```

[//]: # 'Example4'

If you need to tie polling to your own notion of "active" (for example, a game session), wire up `focusManager.setEventListener` with your own signal:

[//]: # 'Example5'

```tsx
import { focusManager } from '@tanstack/react-query'

focusManager.setEventListener((handleFocus) => {
  const onActive = () => handleFocus(true)
  const onIdle = () => handleFocus(false)

  gameSession.on('active', onActive)
  gameSession.on('idle', onIdle)

  return () => {
    gameSession.off('active', onActive)
    gameSession.off('idle', onIdle)
  }
})
```

[//]: # 'Example5'

See [Window Focus Refetching](./window-focus-refetching.md) for the full `focusManager` API.

## Pausing polling

Set `enabled: false` to stop polling when conditions aren't met. Any running interval is cleared immediately, and it restarts when `enabled` becomes `true` again:

[//]: # 'Example6'

```tsx
useQuery({
  queryKey: ['prices', tokenAddress],
  queryFn: () => fetchPrice(tokenAddress),
  refetchInterval: 15_000,
  enabled: !!tokenAddress && !isPaused,
})
```

[//]: # 'Example6'

## Polling with offline support

By default, queries skip fetches when the browser reports no network connection. If your app runs in environments where `navigator.onLine` is unreliable — embedded browsers, Electron, some WebViews — set `networkMode: 'always'` to ignore the online check:

[//]: # 'Example7'

```tsx
useQuery({
  queryKey: ['chainStatus'],
  queryFn: fetchChainStatus,
  refetchInterval: 10_000,
  networkMode: 'always',
})
```

[//]: # 'Example7'

For more on network modes, see [Network Mode](./network-mode.md).

## Note on deduplication

Each `QueryObserver` — each component using `useQuery` with `refetchInterval` — runs its own timer. Two components subscribed to the same key with `refetchInterval: 5000` each fire their timer every 5 seconds. What's deduplicated is concurrent in-flight fetches: if two timers fire at overlapping moments, React Query won't issue two parallel network requests for the same key. The second fetch is held until the first settles. In practice, two components on the same polling interval produce one request per cycle, but the timers are observer-level, not query-level.
