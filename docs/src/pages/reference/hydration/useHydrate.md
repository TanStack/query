---
id: hydration/useHydrate
title: hydration/useHydrate
---

`useHydrate` adds a previously dehydrated state into the `cache` that would be returned by `useQueryCache()`. If the cache already contains data, the new queries will be intelligently merged based on update timestamp.

```jsx
import { useHydrate } from 'react-query/hydration'

useHydrate(dehydratedState)
```

**Options**

- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate
