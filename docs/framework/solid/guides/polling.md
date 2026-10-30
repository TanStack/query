---
id: polling
title: Polling
ref: docs/framework/react/guides/polling.md
replace: { '@tanstack/react-query': '@tanstack/solid-query' }
---

[//]: # 'Example1'

```tsx
useQuery(() => ({
  queryKey: ['prices'],
  queryFn: fetchPrices,
  refetchInterval: 5 * 1000, // every 5 seconds
}))
```

[//]: # 'Example1'
[//]: # 'Example2'

```tsx
useQuery(() => ({
  queryKey: ['job', jobId],
  queryFn: () => fetchJobStatus(jobId),
  refetchInterval: (query) => {
    // Stop polling once the job finishes
    if (query.state.data?.status === 'complete') return false
    return 2 * 1000
  },
}))
```

[//]: # 'Example2'
[//]: # 'Example3'

```tsx
useQuery(() => ({
  queryKey: ['portfolio'],
  queryFn: fetchPortfolio,
  refetchInterval: 30 * 1000,
  refetchIntervalInBackground: true,
}))
```

[//]: # 'Example3'
[//]: # 'Example4'

```tsx
useQuery(() => ({
  queryKey: ['prices', tokenAddress],
  queryFn: () => fetchPrice(tokenAddress),
  refetchInterval: () => {
    if (!tokenAddress || isPaused) return false
    return 15 * 1000
  },
}))
```

[//]: # 'Example4'
[//]: # 'Example5'

```tsx
useQuery(() => ({
  queryKey: ['chainStatus'],
  queryFn: fetchChainStatus,
  refetchInterval: 10 * 1000,
  networkMode: 'always',
}))
```

[//]: # 'Example5'
[//]: # 'ReactNative'
[//]: # 'ReactNative'
