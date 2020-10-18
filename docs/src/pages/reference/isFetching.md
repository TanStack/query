---
id: isFetching
title: isFetching
---

This `isFetching` function returns an `integer` representing how many queries, if any, in the cache are currently fetching (including background-fetching, loading new pages, or loading more infinite query results)

```js
import { isFetching } from 'react-query'

if (isFetching(environment)) {
  console.log('At least one query is fetching!')
}
```

React Query also exports a handy [`useIsFetching`](#useisfetching) hook that will let you subscribe to this state in your components without creating a manual subscription to the query cache.

**Options**

- `environment: Environment`
- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/query-filters)

**Returns**

This method returns the number of fetching queries.
