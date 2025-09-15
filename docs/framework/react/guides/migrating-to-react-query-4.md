---
id: migrating-to-react-query-4
title: Migrating to React Query 4
---

## Breaking Changes

v4 is a major version, so there are some breaking changes to be aware of:

### react-query is now @tanstack/react-query

You will need to un-/install dependencies and change the imports:

```
npm uninstall react-query
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools
```

```tsx
- import { useQuery } from 'react-query' // [!code --]
- import { ReactQueryDevtools } from 'react-query/devtools' // [!code --]

+ import { useQuery } from '@tanstack/react-query' // [!code ++]
+ import { ReactQueryDevtools } from '@tanstack/react-query-devtools' // [!code ++]
```

#### Codemod

To make the import migration easier, v4 comes with a codemod.

> The codemod is a best efforts attempt to help you migrate the breaking change. Please review the generated code thoroughly! Also, there are edge cases that cannot be found by the code mod, so please keep an eye on the log output.

You can easily apply it by using one (or both) of the following commands:

If you want to run it against `.js` or `.jsx` files, please use the command below:

```
npx jscodeshift ./path/to/src/ \
  --extensions=js,jsx \
  --transform=./node_modules/@tanstack/react-query/codemods/v4/replace-import-specifier.js
```

If you want to run it against `.ts` or `.tsx` files, please use the command below:

```
npx jscodeshift ./path/to/src/ \
  --extensions=ts,tsx \
  --parser=tsx \
  --transform=./node_modules/@tanstack/react-query/codemods/v4/replace-import-specifier.js
```

Please note in the case of `TypeScript` you need to use `tsx` as the parser; otherwise, the codemod won't be applied properly!

**Note:** Applying the codemod might break your code formatting, so please don't forget to run `prettier` and/or `eslint` after you've applied the codemod!

**Note:** The codemod will _only_ change the imports - you still have to install the separate devtools package manually.

### Query Keys (and Mutation Keys) need to be an Array

In v3, Query and Mutation Keys could be a String or an Array. Internally, React Query has always worked with Array Keys only, and we've sometimes exposed this to consumers. For example, in the `queryFn`, you would always get the key as an Array to make working with [Default Query Functions](../default-query-function.md) easier.

However, we have not followed this concept through to all apis. For example, when using the `predicate` function on [Query Filters](../filters.md) you would get the raw Query Key. This makes it difficult to work with such functions if you use Query Keys that are mixed Arrays and Strings. The same was true when using global callbacks.

To streamline all apis, we've decided to make all keys Arrays only:

```tsx
;-useQuery('todos', fetchTodos) + // [!code --]
  useQuery(['todos'], fetchTodos) // [!code ++]
```

#### Codemod

To make this migration easier, we decided to deliver a codemod.

> The codemod is a best efforts attempt to help you migrate the breaking change. Please review the generated code thoroughly! Also, there are edge cases that cannot be found by the code mod, so please keep an eye on the log output.

You can easily apply it by using one (or both) of the following commands:

If you want to run it against `.js` or `.jsx` files, please use the command below:

```
npx jscodeshift ./path/to/src/ \
  --extensions=js,jsx \
  --transform=./node_modules/@tanstack/react-query/codemods/v4/key-transformation.js
```

If you want to run it against `.ts` or `.tsx` files, please use the command below:

```
npx jscodeshift ./path/to/src/ \
  --extensions=ts,tsx \
  --parser=tsx \
  --transform=./node_modules/@tanstack/react-query/codemods/v4/key-transformation.js
```

Please note in the case of `TypeScript` you need to use `tsx` as the parser; otherwise, the codemod won't be applied properly!

**Note:** Applying the codemod might break your code formatting, so please don't forget to run `prettier` and/or `eslint` after you've applied the codemod!

### The idle state has been removed

With the introduction of the new [fetchStatus](../queries.md#fetchstatus) for better offline support, the `idle` state became irrelevant, because `fetchStatus: 'idle'` captures the same state better. For more information, please read [Why two different states](../queries.md#why-two-different-states).

This will mostly affect `disabled` queries that don't have any `data` yet, as those were in `idle` state before:

```tsx
- status: 'idle' // [!code --]
+ status: 'loading'  // [!code ++]
+ fetchStatus: 'idle' // [!code ++]
```

Also, have a look at [the guide on dependent queries](../dependent-queries.md)

#### disabled queries

Due to this change, disabled queries (even temporarily disabled ones) will start in `loading` state. To make migration easier, especially for having a good flag to know when to display a loading spinner, you can check for `isInitialLoading` instead of `isLoading`:

```tsx
;-isLoading + // [!code --]
  isInitialLoading // [!code ++]
```

See also the guide on [disabling queries](../disabling-queries.md#isInitialLoading)

### new API for `useQueries`

The `useQueries` hook now accepts an object with a `queries` prop as its input. The value of the `queries` prop is an array of queries (this array is identical to what was passed into `useQueries` in v3).

```tsx
;-useQueries([
  { queryKey1, queryFn1, options1 },
  { queryKey2, queryFn2, options2 },
]) + // [!code --]
  useQueries({
    queries: [
      { queryKey1, queryFn1, options1 },
      { queryKey2, queryFn2, options2 },
    ],
  }) // [!code ++]
```

### Undefined is an illegal cache value for successful queries

In order to make bailing out of updates possible by returning `undefined`, we had to make `undefined` an illegal cache value. This is in-line with other concepts of react-query, for example, returning `undefined` from the [initialData function](../initial-query-data.md#initial-data-function) will also _not_ set data.

Further, it is an easy bug to produce `Promise<void>` by adding logging in the queryFn:

```tsx
useQuery(['key'], () =>
  axios.get(url).then((result) => console.log(result.data)),
)
```

This is now disallowed on type level; at runtime, `undefined` will be transformed to a _failed Promise_, which means you will get an `error`, which will also be logged to the console in development mode.

### Queries and mutations, per default, need network connection to run

Please read the [New Features announcement](#proper-offline-support) about online / offline support, and also the dedicated page about [Network mode](../network-mode.md)

Even though React Query is an Async State Manager that can be used for anything that produces a Promise, it is most often used for data fetching in combination with data fetching libraries. That is why, per default, queries and mutations will be `paused` if there is no network connection. If you want to opt-in to the previous behavior, you can globally set `networkMode: offlineFirst` for both queries and mutations:

```tsx
new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})
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

A [query filter](../filters.md) is an object with certain conditions to match a query. Historically, the filter options have mostly been a combination of boolean flags. However, combining those flags can lead to impossible states. Specifically:

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

```tsx
- active?: boolean // [!code --]
- inactive?: boolean // [!code --]
+ type?: 'active' | 'inactive' | 'all' // [!code ++]
```

The filter defaults to `all`, and you can choose to only match `active` or `inactive` queries.

#### refetchActive / refetchInactive

[queryClient.invalidateQueries](../../../../reference/QueryClient.md#queryclientinvalidatequeries) had two additional, similar flags:

```
refetchActive: Boolean
  - Defaults to true
  - When set to false, queries that match the refetch predicate and are actively being rendered
    via useQuery and friends will NOT be refetched in the background, and only marked as invalid.
refetchInactive: Boolean
  - Defaults to false
  - When set to true, queries that match the refetch predicate and are not being rendered
    via useQuery and friends will be both marked as invalid and also refetched in the background
```

For the same reason, those have also been combined:

```tsx
- refetchActive?: boolean // [!code --]
- refetchInactive?: boolean // [!code --]
+ refetchType?: 'active' | 'inactive' | 'all' | 'none' // [!code ++]
```

This flag defaults to `active` because `refetchActive` defaulted to `true`. This means we also need a way to tell `invalidateQueries` to not refetch at all, which is why a fourth option (`none`) is also allowed here.

### `onSuccess` is no longer called from `setQueryData`

This was confusing to many and also created infinite loops if `setQueryData` was called from within `onSuccess`. It was also a frequent source of error when combined with `staleTime`, because if data was read from the cache only, `onSuccess` was _not_ called.

Similar to `onError` and `onSettled`, the `onSuccess` callback is now tied to a request being made. No request -> no callback.

If you want to listen to changes of the `data` field, you can best do this with a `useEffect`, where `data` is part of the dependency Array. Since React Query ensures stable data through structural sharing, the effect will not execute with every background refetch, but only if something within data has changed:

```
const { data } = useQuery({ queryKey, queryFn })
React.useEffect(() => mySideEffectHere(data), [data])
```

### `persistQueryClient` and the corresponding persister plugins are no longer experimental and have been renamed

The plugins `createWebStoragePersistor` and `createAsyncStoragePersistor` have been renamed to [`createSyncStoragePersister`](../../plugins/createSyncStoragePersister.md) and [`createAsyncStoragePersister`](../../plugins/createAsyncStoragePersister.md) respectively. The interface `Persistor` in `persistQueryClient` has also been renamed to `Persister`. Checkout [this stackexchange](https://english.stackexchange.com/questions/206893/persister-or-persistor) for the motivation of this change.

Since these plugins are no longer experimental, their import paths have also been updated:

```tsx
- import { persistQueryClient } from 'react-query/persistQueryClient-experimental' // [!code --]
- import { createWebStoragePersistor } from 'react-query/createWebStoragePersistor-experimental' // [!code --]
- import { createAsyncStoragePersistor } from 'react-query/createAsyncStoragePersistor-experimental' // [!code --]

+ import { persistQueryClient } from '@tanstack/react-query-persist-client' // [!code ++]
+ import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister' // [!code ++]
+ import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'  // [!code ++]
```

### The `cancel` method on promises is no longer supported

The [old `cancel` method](../query-cancellation.md#old-cancel-function) that allowed you to define a `cancel` function on promises, which was then used by the library to support query cancellation, has been removed. We recommend to use the [newer API](../query-cancellation.md) (introduced with v3.30.0) for query cancellation that uses the [`AbortController` API](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) internally and provides you with an [`AbortSignal` instance](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for your query function to support query cancellation.

### TypeScript

Types now require using TypeScript v4.1 or greater

### Supported Browsers

As of v4, React Query is optimized for modern browsers. We have updated our browserslist to produce a more modern, performant and smaller bundle. You can read about the requirements [here](../../installation#requirements).

### `setLogger` is removed

It was possible to change the logger globally by calling `setLogger`. In v4, that function is replaced with an optional field when creating a `QueryClient`.

```tsx
- import { QueryClient, setLogger } from 'react-query'; // [!code --]
+ import { QueryClient } from '@tanstack/react-query'; // [!code ++]

- setLogger(customLogger) // [!code --]
- const queryClient = new QueryClient(); // [!code --]
+ const queryClient = new QueryClient({ logger: customLogger }) // [!code ++]
```

### No _default_ manual Garbage Collection server-side

In v3, React Query would cache query results for a default of 5 minutes, then manually garbage collect that data. This default was applied to server-side React Query as well.

This lead to high memory consumption and hanging processes waiting for this manual garbage collection to complete. In v4, by default the server-side `cacheTime` is now set to `Infinity` effectively disabling manual garbage collection (the NodeJS process will clear everything once a request is complete).

This change only impacts users of server-side React Query, such as with Next.js. If you are setting a `cacheTime` manually this will not impact you (although you may want to mirror behavior).

### Logging in production

Starting with v4, react-query will no longer log errors (e.g. failed fetches) to the console in production mode, as this was confusing to many.
Errors will still show up in development mode.

### ESM Support

React Query now supports [package.json `"exports"`](https://nodejs.org/api/packages.html#exports) and is fully compatible with Node's native resolution for both CommonJS and ESM. We don't expect this to be a breaking change for most users, but this restricts the files you can import into your project to only the entry points we officially support.

### Streamlined NotifyEvents

Subscribing manually to the `QueryCache` has always given you a `QueryCacheNotifyEvent`, but this was not true for the `MutationCache`. We have streamlined the behavior and also adapted event names accordingly.

#### QueryCacheNotifyEvent

```tsx
- type: 'queryAdded' // [!code --]
+ type: 'added' // [!code ++]
- type: 'queryRemoved' // [!code --]
+ type: 'removed' // [!code ++]
- type: 'queryUpdated' // [!code --]
+ type: 'updated' // [!code ++]
```

#### MutationCacheNotifyEvent

The `MutationCacheNotifyEvent` uses the same types as the `QueryCacheNotifyEvent`.

> Note: This is only relevant if you manually subscribe to the caches via `queryCache.subscribe` or `mutationCache.subscribe`

### Separate hydration exports have been removed

With version [3.22.0](https://github.com/tannerlinsley/react-query/releases/tag/v3.22.0), hydration utilities moved into the React Query core. With v3, you could still use the old exports from `react-query/hydration`, but these exports have been removed with v4.

```tsx
- import { dehydrate, hydrate, useHydrate, Hydrate } from 'react-query/hydration' // [!code --]
+ import { dehydrate, hydrate, useHydrate, Hydrate } from '@tanstack/react-query' // [!code ++]
```

### Removed undocumented methods from the `queryClient`, `query` and `mutation`

The methods `cancelMutations` and `executeMutation` on the `QueryClient` were undocumented and unused internally, so we removed them. Since it was just a wrapper around a method available on the `mutationCache`, you can still use the functionality of `executeMutation`

```tsx
- executeMutation< // [!code --]
-   TData = unknown, // [!code --]
-   TError = unknown, // [!code --]
-   TVariables = void, // [!code --]
-   TContext = unknown // [!code --]
- >( // [!code --]
-   options: MutationOptions<TData, TError, TVariables, TContext> // [!code --]
- ): Promise<TData> { // [!code --]
-   return this.mutationCache.build(this, options).execute() // [!code --]
- } // [!code --]
```

Additionally, `query.setDefaultOptions` was removed because it was also unused. `mutation.cancel` was removed because it didn't actually cancel the outgoing request.

### The `src/react` directory was renamed to `src/reactjs`

Previously, React Query had a directory named `react` which imported from the `react` module. This could cause problems with some Jest configurations, resulting in errors when running tests like:

```
TypeError: Cannot read property 'createContext' of undefined
```

With the renamed directory this no longer is an issue.

If you were importing anything from `'react-query/react'` directly in your project (as opposed to just `'react-query'`), then you need to update your imports:

```tsx
- import { QueryClientProvider } from 'react-query/react'; // [!code --]
+ import { QueryClientProvider } from '@tanstack/react-query/reactjs'; // [!code ++]
```

## New Features 🚀

v4 comes with an awesome set of new features:

### Support for React 18

React 18 was released earlier this year, and v4 now has first class support for it and the new concurrent features it brings.

### Proper offline support

In v3, React Query has always fired off queries and mutations, but then taken the assumption that if you want to retry it, you need to be connected to the internet. This has led to several confusing situations:

- You are offline and mount a query - it goes to loading state, the request fails, and it stays in loading state until you go online again, even though it is not really fetching.
- Similarly, if you are offline and have retries turned off, your query will just fire and fail, and the query goes to error state.
- You are offline and want to fire off a query that doesn't necessarily need network connection (because you _can_ use React Query for something other than data fetching), but it fails for some other reason. That query will now be paused until you go online again.
- Window focus refetching didn't do anything at all if you were offline.

With v4, React Query introduces a new `networkMode` to tackle all these issues. Please read the dedicated page about the new [Network mode](../network-mode) for more information.

### Tracked Queries per default

React Query defaults to "tracking" query properties, which should give you a nice boost in render optimization. The feature has existed since [v3.6.0](https://github.com/tannerlinsley/react-query/releases/tag/v3.6.0) and has now become the default behavior with v4.

### Bailing out of updates with setQueryData

When using the [functional updater form of setQueryData](../../../../reference/QueryClient.md#queryclientsetquerydata), you can now bail out of the update by returning `undefined`. This is helpful if `undefined` is given to you as `previousValue`, which means that currently, no cached entry exists and you don't want to / cannot create one, like in the example of toggling a todo:

```tsx
queryClient.setQueryData(['todo', id], (previousTodo) =>
  previousTodo ? { ...previousTodo, done: true } : undefined,
)
```

### Mutation Cache Garbage Collection

Mutations can now also be garbage collected automatically, just like queries. The default `cacheTime` for mutations is also set to 5 minutes.

### Custom Contexts for Multiple Providers

Custom contexts can now be specified to pair hooks with their matching `Provider`. This is critical when there may be multiple React Query `Provider` instances in the component tree, and you need to ensure your hook uses the correct `Provider` instance.

An example:

1. Create a data package.

```tsx
// Our first data package: @my-scope/container-data

const context = React.createContext<QueryClient | undefined>(undefined)
const queryClient = new QueryClient()

export const useUser = () => {
  return useQuery(USER_KEY, USER_FETCHER, {
    context,
  })
}

export const ContainerDataProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <QueryClientProvider client={queryClient} context={context}>
      {children}
    </QueryClientProvider>
  )
}
```

2. Create a second data package.

```tsx
// Our second data package: @my-scope/my-component-data

const context = React.createContext<QueryClient | undefined>(undefined)
const queryClient = new QueryClient()

export const useItems = () => {
  return useQuery(ITEMS_KEY, ITEMS_FETCHER, {
    context,
  })
}

export const MyComponentDataProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <QueryClientProvider client={queryClient} context={context}>
      {children}
    </QueryClientProvider>
  )
}
```

3. Use these two data packages in your application.

```tsx
// Our application

import { ContainerDataProvider, useUser } from "@my-scope/container-data";
import { AppDataProvider } from "@my-scope/app-data";
import { MyComponentDataProvider, useItems } from "@my-scope/my-component-data";

<ContainerDataProvider> // <-- Provides container data (like "user") using its own React Query provider
  ...
  <AppDataProvider> // <-- Provides app data using its own React Query provider (unused in this example)
    ...
      <MyComponentDataProvider> // <-- Provides component data (like "items") using its own React Query provider
        <MyComponent />
      </MyComponentDataProvider>
    ...
  </AppDataProvider>
  ...
</ContainerDataProvider>

// Example of hooks provided by the "DataProvider" components above:
const MyComponent = () => {
  const user = useUser() // <-- Uses the context specified in ContainerDataProvider.
  const items = useItems() // <-- Uses the context specified in MyComponentDataProvider
  ...
}
```
