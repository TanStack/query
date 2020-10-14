---
id: hydration/hydrate
title: hydration/hydrate
---

`hydrate` adds a previously dehydrated state into a `cache`. If the queries included in dehydration already exist in the queryCache, `hydrate` does not overwrite them.

```js
import { hydrate } from 'react-query/hydration'

hydrate(queryClient, dehydratedState, options)
```

**Options**

- `client: QueryClient`
  - **Required**
  - The `queryClient` to hydrate the state into
- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate into the client
- `options: HydrateOptions`
  - Optional
  - `defaultOptions: QueryOptions`
    - The default query options to use for the hydrated queries.
