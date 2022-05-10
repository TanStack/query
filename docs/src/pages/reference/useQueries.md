---
id: useQueries
title: useQueries
---

The `useQueries` hook can be used to fetch a variable number of queries:

```js
const results = useQueries([
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
  { queryKey: ['post', 3], queryFn: fetchPost, staleTime: 0, enable: true, refetchOnWindowFocus; true, ... },
])
```

**Options**

The `useQueries` hook accepts query options which are identical to the [`useQuery` hook](/reference/useQuery).

**Returns**

The `useQueries` hook returns an array with all the query results.
