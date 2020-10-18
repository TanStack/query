---
id: removeQueries
title: removeQueries
---

The `removeQueries` function can be used to remove queries from the cache based on their query keys or any other functionally accessible property/state of the query.

```js
import { removeQueries } from 'react-query'

// remove all queries:
removeQueries(environment)

// remove queries partially matching key:
removeQueries(environment, 'posts')

// remove queries exactly matching key:
removeQueries(environment, {
  queryKey: 'posts',
  exact: true,
})
```

**Options**

- `environment: Environment`
- `queryKeyOrFilters?: QueryKey | QueryFilters`

**Returns**

This method does not return anything
