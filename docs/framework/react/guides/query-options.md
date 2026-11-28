---
id: query-options
title: Query Options
---

Keep the cache key, fetch function, and options together in a factory. TypeScript carries the fetcher's data type through the factory to the component and the imperative cache APIs.

[//]: # 'Example1'

```ts
import {
  query,
  queryOptions,
  setQueryData,
  useQueries,
  useQuery,
} from '@tanstack/react-query'

function groupOptions(id: number) {
  return queryOptions({
    queryKey: ['groups', id],
    queryFn: () => fetchGroups(id),
    staleTime: 5 * 1000,
  })
}

// usage:

useQuery(groupOptions(1))
useQueries({
  queries: [groupOptions(1), groupOptions(2)],
})
void query(queryClient, groupOptions(23))
setQueryData(queryClient, groupOptions(42).queryKey, newGroups)
```

[//]: # 'Example1'

For Infinite Queries, a separate [`infiniteQueryOptions`](../reference/functions/infiniteQueryOptions.md) helper is available.

[//]: # 'SelectDescription'

You can still override some options at the component level. A very common and useful pattern is to create per-component [`select`](./render-optimizations.md#select) functions:

[//]: # 'SelectDescription'
[//]: # 'Example2'

```ts
import { queryOptions, select, useQuery } from '@tanstack/react-query'

// selected.data has the selected name's type.

const selected = useQuery(
  queryOptions({
    ...groupOptions(1),
    select: select((group) => group.groupName),
  }),
)
```

[//]: # 'Example2'
