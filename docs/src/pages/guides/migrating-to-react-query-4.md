---
id: migrating-to-react-query-4
title: Migrating to React Query 4
---

## Breaking Changes

### Separate hydration exports have been removed

With version [3.22.0](https://github.com/tannerlinsley/react-query/releases/tag/v3.22.0), hydration utilities moved into the react-query core. With v3, you could still use the old exports from `react-query/hydration`, but these exports have been removed with v4.

```diff
- import { dehydrate, hydrate, useHydrate, Hydrate } from 'react-query/hydration'
+ import { dehydrate, hydrate, useHydrate, Hydrate } from 'react-query'
```




