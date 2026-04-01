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

Polling is independent of `staleTime`. A query can be fresh and still poll on schedule; see [Important Defaults](./important-defaults.md) for how `staleTime` interacts with other refetch behaviors. `refetchInterval` fires on its own clock regardless of freshness.

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

## Pausing polling

Pass a function to `refetchInterval` and close over component state to control when polling runs:

[//]: # 'Example4'

```tsx
useQuery({
  queryKey: ['prices', tokenAddress],
  queryFn: () => fetchPrice(tokenAddress),
  refetchInterval: () => {
    if (!tokenAddress || isPaused) return false
    return 15_000
  },
})
```

[//]: # 'Example4'

## Polling with offline support

TanStack Query detects connectivity by listening to the browser's `online` and `offline` events. In environments where those events don't fire reliably (Electron, some embedded WebViews), set `networkMode: 'always'` to skip the connectivity check:

[//]: # 'Example5'

```tsx
useQuery({
  queryKey: ['chainStatus'],
  queryFn: fetchChainStatus,
  refetchInterval: 10_000,
  networkMode: 'always',
})
```

[//]: # 'Example5'

For more on network modes, see [Network Mode](./network-mode.md).

## Note on deduplication

Each `QueryObserver` (each component using `useQuery` with `refetchInterval`) runs its own timer. Two components subscribed to the same key with `refetchInterval: 5000` each fire their timer every 5 seconds. What gets deduplicated is concurrent in-flight fetches: if two timers fire at the same time, only one network request goes out. The timers are observer-level; the deduplication is query-level.

[//]: # 'ReactNative'

## Non-browser environments

For non-browser runtimes like React Native, the standard `online`/`offline` and focus events aren't available. The [React Native guide](../react-native.md) covers how to connect `focusManager` and `onlineManager` to native app state APIs.

[//]: # 'ReactNative'
