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

### Streamlined NotifyEvents

Subscribing manually to the `QueryCache` has always given you a `QueryCacheNotifyEvent`, but this was not true for the `MutationCache`. We have streamlined the behavior and also adapted event names accordingly.

#### QueryCacheNotifyEvent

```diff
- type: 'queryAdded'
+ type: 'added'
- type: 'queryRemoved'
+ type: 'removed'
- type: 'queryUpdated'
+ type: 'updated'
```

#### MutationCacheNotifyEvent

The `MutationCacheNotifyEvent` uses the same types as the `QueryCacheNotifyEvent`.

> Note: This is only relevant if you manually subscribe to the caches via `queryCache.subscribe` or `mutationCache.subscribe`

### The `src/react` directory was renamed to `src/reactjs`

Previously, react-query had a directory named `react` which imported from the `react` module. This could cause problems with some Jest configurations, resulting in errors when running tests like:

```
TypeError: Cannot read property 'createContext' of undefined
```

With the renamed directory this no longer is an issue.

If you were importing anything from `'react-query/react'` directly in your project (as opposed to just `'react-query'`), then you need to update your imports:

```diff
- import { QueryClientProvider } from 'react-query/react';
+ import { QueryClientProvider } from 'react-query/reactjs';
```

### `persistQueryClient` and the corresponding persister plugins are no longer experimental and have been renamed

The plugins `createWebStoragePersistor` and `createAsyncStoragePersistor` have been renamed to [`createWebStoragePersister`](/plugins/createWebStoragePersister) and [`createAsyncStoragePersister`](/plugins/createAsyncStoragePersister) respectively. The interface `Persistor` in `persistQueryClient` has also been renamed to `Persister`. Checkout [this stackexchange](https://english.stackexchange.com/questions/206893/persister-or-persistor) for the motivation of this change.

Since these plugins are no longer experimental, their import paths have also been updated:

```diff
- import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
- import { createWebStoragePersistor } from 'react-query/createWebStoragePersistor-experimental'
- import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental'

+ import { persistQueryClient } from 'react-query/persistQueryClient'
+ import { createWebStoragePersister } from 'react-query/createWebStoragePersister'
+ import { createAsyncStoragePersister } from 'react-query/createAsyncStoragePersister'
```

## New Features 🚀

### Mutation Cache Garbage Collection

Mutations can now also be garbage collected automatically, just like queries. The default `cacheTime` for mutations is also set to 5 minutes.
