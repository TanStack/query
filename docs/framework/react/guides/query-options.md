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

A component can select part of the cached data by passing a callback to `select`. Spreading a prepared query into `queryOptions` preserves the fetcher's data type for the callback.

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

For a dynamic `useQueries` list, prepare each entry so TypeScript can infer its selector input independently.

```ts
const groups = useQueries({
  queries: ids.map((id) =>
    queryOptions({
      ...groupOptions(id),
      select: select((group) => group.groupName),
    }),
  ),
})
```

When passing raw entries with different result types directly to `useQueries`, define a reusable selection first, such as `const groupName = select((group: Group) => group.groupName)`, and pass `select: groupName` in the entry. For an infinite query whose fetcher derives its return type from `pageParam`, typing the fetcher's parameter lets the selector infer the page data.
