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

### `notifyOnChangePropsExclusion` has been removed

In v4, `notifyOnChangeProps` defaults to the `"tracked"` behavior of v3 instead of `undefined`. Now that `"tracked"` is the default behavior for v4, it no longer makes sense to include this config option.

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

### Query Filters

A [query filter](../guides/filters) is an object with certain conditions to match a query. Historically, the filter options have mostly been a combination of boolean flags. However, combining those flags can lead to impossible states. Specifically:

```
active?: boolean
  - When set to true it will match active queries.
  - When set to false it will match inactive queries.
inactive?: boolean
  - When set to true it will match inactive queries.
  - When set to false it will match active queries.
```

Those flags don't work well when used together, because they are mutually exclusive. Setting `false` for both flags could match all queries, judging from the description, or no queries, which doesn't make much sense.

With v4, those filters have been combined into a single filter to better show the intent:

```diff
- active?: boolean
- inactive?: boolean
+ type?: 'active' | 'inactive' | 'all'
```

The filter defaults to `all`, and you can choose to only match `active` or `inactive` queries.

#### refetchActive / refetchInactive

[queryClient.invalidateQueries](../reference/QueryClient#queryclientinvalidatequeries) had two additional, similar flags:

```
refetchActive: Boolean
  - Defaults to true
  - When set to false, queries that match the refetch predicate and are actively being rendered via useQuery and friends will NOT be refetched in the background, and only marked as invalid.
refetchInactive: Boolean
  - Defaults to false
  - When set to true, queries that match the refetch predicate and are not being rendered via useQuery and friends will be both marked as invalid and also refetched in the background
```

For the same reason, those have also been combined:

```diff
- active?: boolean
- inactive?: boolean
+ refetchType?: 'active' | 'inactive' | 'all' | 'none'
```

This flag defaults to `active` because `refetchActive` defaulted to `true`. This means we also need a way to tell `invalidateQueries` to not refetch at all, which is why a fourth option (`none`) is also allowed here.
