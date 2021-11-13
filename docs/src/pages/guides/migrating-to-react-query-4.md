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

### Consistent behavior for `cancelRefetch`

The `cancelRefetch` can be passed to all functions that imperatively fetch a query, namely:

- `queryClient.refetchQueries`
  - `queryClient.invalidateQueries`
  - `queryClient.resetQueries`
- `refetch` returned from `useQuery`
- `fetchNetPage` and `fetchPreviousPage` returned from `useInfiniteQuery`

Except for `fetchNetxPage` and `fetchPreviousPage`, this flag was defaulting to `false`, which was inconsistent and potentially troublesome: Calling `refetchQueries` or `invalidateQueries` after a mutation might not yield the latest result if a previous slow fetch was already ongoing, because this refetch would have been skipped.

We believe that if a query is actively refetched by some code you write, it should, per default, re-start the fetch.

That is why this flag now defaults to _true_ for all methods mentioned above. It also means that if you call `refetchQueries` twice in a row, without awaiting it, it will now cancel the first fetch and re-start it with the second one:

```
queryClient.refetchQueries({ queryKey: ['todos'] })
// this will abort the previous refetch and start a new fetch
queryClient.refetchQueries({ queryKey: ['todos'] })
```

You can opt-out of this behaviour by explicitly passing `cancelRefetch:false`:

```
queryClient.refetchQueries({ queryKey: ['todos'] })
// this will not abort the previous refetch - it will just be ignored
queryClient.refetchQueries({ queryKey: ['todos'] }, { cancelRefetch: false })
```

> Note: There is no change in behaviour for automatically triggered fetches, e.g. because a query mounts or because of a window focus refetch.
