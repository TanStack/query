---
id: fetchInfiniteQuery
title: fetchInfiniteQuery
---

`fetchInfiniteQuery` can be used to fetch infinite queries.

```js
import { fetchInfiniteQuery } from 'react-query'

try {
  const data = await fetchInfiniteQuery(environment, {
    queryKey,
    queryFn,
  })
  console.log(data.pages)
} catch (error) {
  console.log(error)
}
```

**Options**

The options for `fetchInfiniteQuery` are exactly the same as those of [`useInfiniteQuery`](#useinfinitequery).

**Returns**

- `Promise<InfiniteData<TData>>`
