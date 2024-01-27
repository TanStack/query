---
id: query-options
title: Query Options
ref: docs/framework/react/guides/query-options.md
---

[//]: # 'Example1'

```ts
import { queryOptions } from '@tanstack/angular-query-experimental'

groupOptions = (id: number) => {
  return () =>
    queryOptions({
      queryKey: ['groups', id],
      queryFn: () => fetchGroups(id),
      staleTime: 5 * 1000,
    })
}

// usage:

injectQuery(groupOptions(1))
injectQueries({
  queries: [groupOptions(1), groupOptions(2)],
})
queryClient.prefetchQuery(groupOptions(23))
queryClient.setQueryData(groupOptions(42).queryKey, newGroups)
```

[//]: # 'Example1'
