---
id: fetchQuery
title: fetchQuery
---

`fetchQuery` is an asynchronous function that can be used to fetch and cache a query. It will either resolve with the data or throw with the error. Use the `prefetchQuery` function if you just want to fetch a query without needing the result.

If the query exists and the data is not invalidated or older than the given `staleTime`, then the data from the cache will be returned. Otherwise it will try to fetch the latest data.

> The difference between using `fetchQuery` and `setQueryData` is that `fetchQuery` is async and will ensure that duplicate requests for this query are not created with `useQuery` instances for the same query are rendered while the data is fetching.

```js
import { fetchQuery } from 'react-query'

try {
  const data = await fetchQuery(environment, {
    queryKey,
    queryFn,
  })
} catch (error) {
  console.log(error)
}
```

Specify a `staleTime` to only fetch when the data is older than a certain amount of time:

```js
import { fetchQuery } from 'react-query'

try {
  const data = await fetchQuery(environment, {
    queryKey,
    queryFn,
    staleTime: 10000,
  })
} catch (error) {
  console.log(error)
}
```

**Options**

The options for `fetchQuery` are exactly the same as those of [`useQuery`](#usequery).

**Returns**

- `Promise<TData>`
