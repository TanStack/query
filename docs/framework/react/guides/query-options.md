---
id: query-options
title: Query Options
---

One of the best ways to share `queryKey` and `queryFn` between multiple places, yet keep them co-located to one another, is to use the `queryOptions` helper. At runtime, this helper just returns whatever you pass into it, but it has a lot of advantages when using it [with TypeScript](../typescript.md#typing-query-options). You can define all possible options for a query in one place, and you'll also get type inference and type safety for all of them.

For framework-agnostic code, `@tanstack/query-core` also exports `queryOptions`, `infiniteQueryOptions`, and `mutationOptions`. They infer query data, page parameters, and mutation variables without depending on a framework, but they only accept the options that every adapter supports. Use the adapter's helpers when you need framework-specific options such as `throwOnError`.

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
queryClient.query(groupOptions(23))
queryClient.setQueryData(groupOptions(42).queryKey, newGroups)
```

[//]: # 'Example1'

For Infinite Queries, a separate [`infiniteQueryOptions`](../reference/functions/infiniteQueryOptions.md) helper is available.

[//]: # 'SelectDescription'

You can still override some options at the component level. A very common and useful pattern is to create per-component [`select`](./render-optimizations.md#select) functions:

[//]: # 'SelectDescription'
[//]: # 'Example2'

```ts
// Type inference still works, so query.data will be the return type of select instead of queryFn

const query = useQuery({
  ...groupOptions(1),
  select: (data) => data.groupName,
})
```

[//]: # 'Example2'
