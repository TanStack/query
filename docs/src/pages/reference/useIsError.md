---
id: useIsError
title: useIsError
---

`useIsError` is an optional hook that returns the `number` of the queries that encountered an error.

```js
import { useIsError } from 'react-query'
// How many queries hit an error?
const isError = useIsError()
// How many queries matching the posts prefix hit an error?
const isPostsErrored = useIsError(['posts'])
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)

**Returns**

- `isError: number`
  - Will be the `number` of the queries that encountered an error.
