---
id: query-options
title: Query Options
ref: docs/framework/react/guides/query-options.md
replace:
  {
    '@tanstack/react-query': '@tanstack/solid-query',
    'useMutationState[(]': 'useMutationState(() => ',
    'useMutation[(]': 'useMutation(() => ',
    'useQuery[(]': 'useQuery(() => ',
    'useQueries[(]': 'useQueries(() => ',
    'useInfiniteQuery[(]': 'useInfiniteQuery(() => ',
  }
---

[//]: # 'Example1'

```ts
import { queryOptions } from '@tanstack/solid-query'

function groupOptions(id: number) {
  return queryOptions({
    queryKey: ['groups', id],
    queryFn: () => fetchGroups(id),
    staleTime: 5 * 1000,
  })
}

// usage:

useQuery(() => groupOptions(1))
useQueries(() => ({
  queries: [groupOptions(1), groupOptions(2)],
}))
queryClient.prefetchQuery(groupOptions(23))
queryClient.setQueryData(groupOptions(42).queryKey, newGroups)
```

[//]: # 'Example1'
[//]: # 'SelectDescription'

You can still override some options at the component level. A very common and useful pattern is to create per-component `select` functions:

[//]: # 'SelectDescription'
[//]: # 'Example2'

```ts
// Type inference still works, so query.data will be the return type of select instead of queryFn

const groupQuery = useQuery(() => ({
  ...groupOptions(1),
  select: (data) => data.groupName,
}))
```

[//]: # 'Example2'
