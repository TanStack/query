---
id: migrating-to-react-query-4
title: Migrating to React Query 4
---

## Breaking Changes

### Query Keys (and Mutation Keys) need to be an Array

In v3, Query and Mutation Keys could be a String or an Array. Internally, React Query has always worked with Array Keys only, and we've sometimes exposed this to consumers. For example, in the `queryFn`, you would always get the key as an Array to make working with [Default Query Functions](./default-query-function) easier.

However, we have not followed this concept through to all apis. For example, when using the `predicate` function on [Query Filters](./filters) you would get the raw Query Key. This makes it difficult to work with such functions if you use Query Keys that are mixed Arrays and Strings. The same was true when using global callbacks.

To streamline all apis, we've decided to make all keys Arrays only:

```diff
- useQuery('todos', fetchTodos)
+ useQuery(['todos'], fetchTodos)
```

To make this migration easier we decided to deliver a codemod. You can easily apply it by using one (or both) of the following commands.

If you want to run it against `.js` or `.jsx` files, please use the command below:

`npx jscodeshift --extensions=js,jsx --transform=./node_modules/react-query/codemods/v4/key-transformation.js ./path/to/src/`

If you want to run it against `.ts` or `.tsx` files, please use the command below:

`npx jscodeshift --extensions=ts,tsx --parser=tsx --transform=./node_modules/react-query/codemods/v4/key-transformation.js ./path/to/src/`

Please note in the case of `TypeScript` you need to use `tsx` as the parser otherwise, the codemod won't be applied properly!

**Note:** Applying the codemod might break your code formatting, so please don't forget to run `prettier` and/or `eslint` after you've applied the codemod!

### Separate hydration exports have been removed

With version [3.22.0](https://github.com/tannerlinsley/react-query/releases/tag/v3.22.0), hydration utilities moved into the React Query core. With v3, you could still use the old exports from `react-query/hydration`, but these exports have been removed with v4.

```diff
- import { dehydrate, hydrate, useHydrate, Hydrate } from 'react-query/hydration'
+ import { dehydrate, hydrate, useHydrate, Hydrate } from 'react-query'
```

### `notifyOnChangeProps` property no longer accepts `"tracked"` as a value

The `notifyOnChangeProps` option no longer accepts a `"tracked"` value. Instead, `useQuery` defaults to tracking properties. All queries using `notifyOnChangeProps: "tracked"` should be updated by removing this option.

If you would like to bypass this in any queries to emulate the v3 default behavior of re-rendering whenever a query changes, `notifyOnChangeProps` now accepts an `"all"` value to opt-out of the default smart tracking optimization.

### `notifyOnChangePropsExclusion` has been removed

In v4, `notifyOnChangeProps` defaults to the `"tracked"` behavior of v3 instead of `undefined`. Now that `"tracked"` is the default behavior for v4, it no longer makes sense to include this config option.

### Consistent behavior for `cancelRefetch`

The `cancelRefetch` option can be passed to all functions that imperatively fetch a query, namely:

- `queryClient.refetchQueries`
- `queryClient.invalidateQueries`
- `queryClient.resetQueries`
- `refetch` returned from `useQuery`
- `fetchNextPage` and `fetchPreviousPage` returned from `useInfiniteQuery`

Except for `fetchNextPage` and `fetchPreviousPage`, this flag was defaulting to `false`, which was inconsistent and potentially troublesome: Calling `refetchQueries` or `invalidateQueries` after a mutation might not yield the latest result if a previous slow fetch was already ongoing, because this refetch would have been skipped.

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

Previously, React Query had a directory named `react` which imported from the `react` module. This could cause problems with some Jest configurations, resulting in errors when running tests like:

```
TypeError: Cannot read property 'createContext' of undefined
```

With the renamed directory this no longer is an issue.

If you were importing anything from `'react-query/react'` directly in your project (as opposed to just `'react-query'`), then you need to update your imports:

```diff
- import { QueryClientProvider } from 'react-query/react';
+ import { QueryClientProvider } from 'react-query/reactjs';
```

### `onSuccess` is no longer called from `setQueryData`

This was confusing to many and also created infinite loops if `setQueryData` was called from within `onSuccess`. It was also a frequent source of error when combined with `staleTime`, because if data was read from the cache only, `onSuccess` was _not_ called.

Similar to `onError` and `onSettled`, the `onSuccess` callback is now tied to a request being made. No request -> no callback.

If you want to listen to changes of the `data` field, you can best do this with a `useEffect`, where `data` is part of the dependency Array. Since React Query ensures stable data through structural sharing, the effect will not execute with every background refetch, but only if something within data has changed:

```
const { data } = useQuery({ queryKey, queryFn })
React.useEffect(() => mySideEffectHere(data), [data])
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

### The `cancel` method on promises is no longer supported

The [old `cancel` method](../guides/query-cancellation#old-cancel-function) that allowed you to define a `cancel` function on promises, which was then used by the library to support query cancellation, has been removed. We recommend to use the [newer API](../guides/query-cancellation) (introduced with v3.30.0) for query cancellation that uses the [`AbortController` API](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) internally and provides you with an [`AbortSignal` instance](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for your query function to support query cancellation.

### Queries and mutations, per default, need network connection to run

Please read the [New Features announcement](#proper-offline-support) about online / offline support, and also the dedicated page about [Network mode](../guides/network-mode)

Even though React Query is an Async State Manager that can be used for anything that produces a Promise, it is most often used for data fetching in combination with data fetching libraries. That is why, per default, queries and mutations will be `paused` if there is no network connection. If you want to opt-in to the previous behavior, you can globally set `networkMode: offlineFirst` for both queries and mutations:

```js
new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst'
    },
    mutations: {
      networkmode: 'offlineFirst'
    }
  }
})
```

### new API for `useQueries`

The `useQueries` hook now accepts an object with a `queries` prop as its input. The value of the `queries` prop is an array of queries (this array is identical to what was passed into `useQueries` in v3).

```diff
- useQueries([{ queryKey1, queryFn1, options1 }, { queryKey2, queryFn2, options2 }])
+ useQueries({ queries: [{ queryKey1, queryFn1, options1 }, { queryKey2, queryFn2, options2 }] })
```


### Removed undocumented methods from the `queryClient` and `query`

The methods `cancelMutatations` and `executeMutation` on the `QueryClient` were undocumented and unused internally, so we removed them. Since they were just wrappers around methods available on the `mutationCache`, you can still use the functionality.

```diff
- cancelMutations(): Promise<void> {
-   const promises = notifyManager.batch(() =>
-     this.mutationCache.getAll().map(mutation => mutation.cancel())
-   )
-   return Promise.all(promises).then(noop).catch(noop)
- }
```

```diff
- executeMutation<
-   TData = unknown,
-   TError = unknown,
-   TVariables = void,
-   TContext = unknown
- >(
-   options: MutationOptions<TData, TError, TVariables, TContext>
- ): Promise<TData> {
-   return this.mutationCache.build(this, options).execute()
- }
```

Additionally, `query.setDefaultOptions` was removed because it was also unused.

### TypeScript

Types now require using TypeScript v4.1 or greater

### Logging

Starting with v4, react-query will no longer log errors (e.g. failed fetches) to the console in production mode, as this was confusing to many.
Errors will still show up in development mode.

## New Features 🚀

### Proper offline support

In v3, React Query has always fired off queries and mutations, but then taken the assumption that if you want to retry it, you need to be connected to the internet. This has led to several confusing situations:

- You are offline and mount a query - it goes to loading state, the request fails, and it stays in loading state until you go online again, even though it is not really fetching.
- Similarly, if you are offline and have retries turned off, your query will just fire and fail, and the query goes to error state.
- You are offline and want to fire off a query that doesn't necessarily need network connection (because you _can_ use React Query for something other than data fetching), but it fails for some other reason. That query will now be paused until you go online again.
- Window focus refetching didn't do anything at all if you were offline.

With v4, React Query introduces a new `networkMode` to tackle all these issues. Please read the dedicated page about the new [Network mode](../guides/network-mode) for more information.

### Mutation Cache Garbage Collection

Mutations can now also be garbage collected automatically, just like queries. The default `cacheTime` for mutations is also set to 5 minutes.

### Tracked Queries per default

React Query defaults to "tracking" query properties, which should give you a nice boost in render optimization. The feature has existed since [v3.6.0](https://github.com/tannerlinsley/react-query/releases/tag/v3.6.0) and has now become the default behavior with v4.
