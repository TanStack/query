---
id: prefetchInfiniteQuery
title: prefetchInfiniteQuery
---

`prefetchInfiniteQuery` can be used to prefetch infinite queries.

```js
import { prefetchInfiniteQuery } from 'react-query'

await prefetchInfiniteQuery(environment, {
  queryKey,
  queryFn,
})
```

**Options**

The options for `prefetchInfiniteQuery` are exactly the same as those of [`useInfiniteQuery`](#useinfinitequery).

**Returns**

- `Promise<void>`
  - A promise is returned that will either immediately resolve if no fetch is needed or after the query has been executed. It will not return any data or throw any errors.
