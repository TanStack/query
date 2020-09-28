---
id: hydration/hydrate
title: hydration/hydrate
---

`hydrate` adds a previously dehydrated state into a `cache`. If the queries included in dehydration already exist in the cache, `hydrate` does not overwrite them.

```js
import { hydrate } from 'react-query/hydration'

hydrate(cache, dehydratedState)
```

**Options**

- `cache: QueryCache`
  - **Required**
  - The `cache` to hydrate the state into
- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate into the cache
