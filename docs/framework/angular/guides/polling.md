---
id: polling
title: Polling
ref: docs/framework/react/guides/polling.md
replace: { '@tanstack/react-query': '@tanstack/angular-query' }
---

[//]: # 'Example1'

```ts
import { refetchInterval } from '@tanstack/angular-query'

injectQuery(() => ({
  queryKey: ['prices'],
  queryFn: fetchPrices,
  refetchInterval: refetchInterval(5 * 1000), // every 5 seconds
}))
```

[//]: # 'Example1'
[//]: # 'Example2'

```ts
import { refetchInterval } from '@tanstack/angular-query'

injectQuery(() => {
  const jobId = this.jobId()

  return {
    queryKey: ['job', jobId],
    queryFn: () => fetchJobStatus(jobId),
    refetchInterval: refetchInterval((query) => {
      // Stop polling once the job finishes
      if (query.state.data?.status === 'complete') return false
      return 2 * 1000
    }),
  }
})
```

[//]: # 'Example2'
[//]: # 'Example3'

```ts
import { refetchInterval } from '@tanstack/angular-query'

injectQuery(() => ({
  queryKey: ['portfolio'],
  queryFn: fetchPortfolio,
  refetchInterval: refetchInterval(30 * 1000),
  refetchIntervalInBackground: true,
}))
```

[//]: # 'Example3'
[//]: # 'Example4'

```ts
import { refetchInterval } from '@tanstack/angular-query'

injectQuery(() => {
  // Read signals here so the query reacts when they change
  const tokenAddress = this.tokenAddress()
  const isPaused = this.isPaused()

  return {
    queryKey: ['prices', tokenAddress],
    queryFn: () => fetchPrice(tokenAddress),
    refetchInterval: refetchInterval(() => {
      if (!tokenAddress || isPaused) return false
      return 15 * 1000
    }),
  }
})
```

[//]: # 'Example4'
[//]: # 'Example5'

```ts
import { refetchInterval } from '@tanstack/angular-query'

injectQuery(() => ({
  queryKey: ['chainStatus'],
  queryFn: fetchChainStatus,
  refetchInterval: refetchInterval(10 * 1000),
  networkMode: 'always',
}))
```

[//]: # 'Example5'
[//]: # 'ReactNative'
[//]: # 'ReactNative'
[//]: # 'ReRenders'
[//]: # 'ReRenders'
