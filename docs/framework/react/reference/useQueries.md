---
id: useQueries
title: useQueries
---

The `useQueries` hook can be used to fetch a variable number of queries:

```js
const results = useQueries([
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
])
```

**Options**

The `useQueries` hook accepts an array with query option objects identical to the [`useQuery` hook](/reference/useQuery).

**Returns**

The `useQueries` hook returns an array with all the query results.
