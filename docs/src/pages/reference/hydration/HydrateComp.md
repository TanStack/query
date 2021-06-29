---
id: hydration/HydrateComp
title: hydration/Hydrate
---

`hydration/Hydrate` adds a previously dehydrated state into the `queryClient` that would be returned by `useQueryClient()`. If the client already contains data, the new queries will be intelligently merged based on update timestamp.

```js
import { Hydrate } from 'react-query/hydration'

function App() {
  return <Hydrate state={dehydratedState}>...</Hydrate>
}
```

**Options**

- `state: DehydratedState`
  - The state to hydrate
- `options: HydrateOptions`
  - Optional
  - `defaultOptions: QueryOptions`
    - The default query options to use for the hydrated queries.
