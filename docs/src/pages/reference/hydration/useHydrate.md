---
id: hydration/useHydrate
title: hydration/useHydrate
---

`useHydrate` adds a previously dehydrated state into the `queryClient` that would be returned by `useQueryClient()`. If the client already contains data, the new queries will be intelligently merged based on update timestamp.

```jsx
import { useHydrate } from 'react-query/hydration'

useHydrate(dehydratedState, options)
```

**Options**

- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate
- `options: HydrateOptions`
  - Optional
  - `defaultOptions: QueryOptions`
    - The default query options to use for the hydrated queries.
