---
id: refetchQueries
title: refetchQueries
---

The `refetchQueries` function can be used to refetch queries based on certain conditions.

Examples:

```js
import { refetchQueries } from 'react-query'

// refetch all queries:
await refetchQueries(environment)

// refetch all stale queries:
await refetchQueries(environment, {
  stale: true,
})

// refetch all active queries partially matching a query key:
await refetchQueries(environment, {
  queryKey: ['posts'],
  active: true,
})

// refetch all active queries exactly matching a query key:
await refetchQueries(environment, {
  queryKey: ['posts', 1],
  active: true,
  exact: true,
})
```

**Options**

- `environment: Environment`
- `queryKeyOrFilters?: QueryKey | QueryFilters`
- `refetchOptions?: RefetchOptions`:
  - `throwOnError?: boolean`
    - When set to `true`, this method will throw if any of the query refetch tasks fail.

**Returns**

This function returns a promise that will resolve when all of the queries are done being refetched. By default, it **will not** throw an error if any of those queries refetches fail, but this can be configured by setting the `throwOnError` option to `true`
