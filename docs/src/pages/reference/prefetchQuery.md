---
id: prefetchQuery
title: prefetchQuery
---

`prefetchQuery` is an asynchronous function that can be used to prefetch a query before it is needed or rendered with `useQuery` and friends. The method works the same as `fetchQuery` except that it will not throw or return any data.

```js
import { prefetchQuery } from 'react-query'

await prefetchQuery(environment, {
  queryKey,
  queryFn,
})
```

You can even use it with a default queryFn in your config!

```js
import { prefetchQuery } from 'react-query'

await prefetchQuery(environment, {
  queryKey,
})
```

**Options**

The options for `prefetchQuery` are exactly the same as those of [`useQuery`](#usequery).

**Returns**

- `Promise<void>`
  - A promise is returned that will either immediately resolve if no fetch is needed or after the query has been executed. It will not return any data or throw any errors.
