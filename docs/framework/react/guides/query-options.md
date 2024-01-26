---
id: query-options
title: Query Options
---

One of the best ways to share `queryKey` and `queryFn` between multiple places, yet keep them co-located to one another, is to use the `queryOptions` helper. At runtime, this helper just returns whatever you pass into it, but it has a lot of advantages when using it [with TypeScript](./typescript#typing-query-options). You can define all possible options for a query in one place, and you'll also get type inference and type safety for all of them.

[//]: # 'Example1'

```ts
import { queryOptions } from '@tanstack/react-query'

function groupOptions(id: number) {
  return queryOptions({
    queryKey: ['groups', id],
    queryFn: () => fetchGroups(id),
    staleTime: 5 * 1000,
  })
}

// usage:

useQuery(groupOptions(1))
useSuspenseQuery(groupOptions(5))
useQueries({
  queries: [groupOptions(1), groupOptions(2)],
})
queryClient.prefetchQuery(groupOptions(23))
queryClient.setQueryData(groupOptions(42).queryKey, newGroups)
```

[//]: # 'Example1'

For Infinite Queries, a separate `infiniteQueryOptions` helper is available.
