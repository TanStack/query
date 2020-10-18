---
id: setQueryData
title: setQueryData
---

`setQueryData` is a synchronous function that can be used to immediately update a query's cached data. If the query does not exist, it will be created. **If the query is not utilized by a query hook in the default `cacheTime` of 5 minutes, the query will be garbage collected**.

> The difference between using `setQueryData` and `fetchQuery` is that `setQueryData` is sync and assumes that you already synchronously have the data available. If you need to fetch the data asynchronously, it's suggested that you either refetch the query key or use `fetchQuery` to handle the asynchronous fetch.

```js
import { setQueryData } from 'react-query'

setQueryData(environment, queryKey, updater)
```

**Options**

- `environment: Environment`
- `queryKey: QueryKey` [Query Keys](./guides/query-keys)
- `updater: unknown | (oldData: TData | undefined) => TData`
  - If non-function is passed, the data will be updated to this value
  - If a function is passed, it will receive the old data value and be expected to return a new one.

**Using an updater value**

```js
setQueryData(environment, queryKey, newData)
```

**Using an updater function**

For convenience in syntax, you can also pass an updater function which receives the current data value and returns the new one:

```js
setQueryData(environment, queryKey, oldData => newData)
```
