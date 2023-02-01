---
id: migrating-to-tanstack-query-5
title: Migrating to TanStack Query v5
---

## Breaking Changes

v5 is a major version, so there are some breaking changes to be aware of:

### Supports a single signature, one object

useQuery and friends used to have many overloads in TypeScript - different ways how the function can be invoked. Not only this was tough to maintain, type wise, it also required a runtime check to see which type the first and the second parameter, to correctly create options.

now we only support the object format.

```diff
- useQuery(key, fn, options)
+ useQuery({ queryKey, queryFn, ...options })

- useInfiniteQuery(key, fn, options)
+ useInfiniteQuery({ queryKey, queryFn, ...options })

- useMutation(fn, options)
+ useMutation({ mutationFn, ...options })

- useIsFetching(key, filters)
+ useIsFetching({ queryKey, ...filters })

- useIsMutating(key, filters)
+ useIsMutating({ mutationKey, ...filters })
```

```diff
- queryClient.isFetching(key, filters)
+ queryClient.isFetching({ queryKey, ...filters })

- queryClient.ensureQueryData(key, filters)
+ queryClient.ensureQueryData({ queryKey, ...filters })

- queryClient.getQueriesData(key, filters)
+ queryClient.getQueriesData({ queryKey, ...filters })

- queryClient.setQueriesData(key, updater, filters, options)
+ queryClient.setQueriesData({ queryKey, ...filters }, updater, options)

- queryClient.removeQueries(key, filters)
+ queryClient.removeQueries({ queryKey, ...filters })

- queryClient.resetQueries(key, filters, options)
+ queryClient.resetQueries({ queryKey, ...filters }, options)

- queryClient.cancelQueries(key, filters, options)
+ queryClient.cancelQueries({ queryKey, ...filters }, options)

- queryClient.invalidateQueries(key, filters, options)
+ queryClient.invalidateQueries({ queryKey, ...filters }, options)

- queryClient.refetchQueries(key, filters, options)
+ queryClient.refetchQueries({ queryKey, ...filters }, options)

- queryClient.fetchQuery(key, fn, options)
+ queryClient.fetchQuery({ queryKey, queryFn, ...options })

- queryClient.prefetchQuery(key, fn, options)
+ queryClient.prefetchQuery({ queryKey, queryFn, ...options })

- queryClient.fetchInfiniteQuery(key, fn, options)
+ queryClient.fetchInfiniteQuery({ queryKey, queryFn, ...options })

- queryClient.prefetchInfiniteQuery(key, fn, options)
+ queryClient.prefetchInfiniteQuery({ queryKey, queryFn, ...options })
```

```diff
- queryCache.find(key, filters)
+ queryCache.find({ queryKey, ...filters })

- queryCache.findAll(key, filters)
+ queryCache.findAll({ queryKey, ...filters })
```

### `queryClient.getQueryData` now accepts queryKey only as an Argument

`queryClient.getQueryData` argument is changed to accept only a `queryKey`

```diff
- queryClient.getQueryData(queryKey, filters)
+ queryClient.getQueryData(queryKey)
```

### `queryClient.getQueryState` now accepts queryKey only as an Argument

`queryClient.getQueryState` argument is changed to accept only a `queryKey`

```diff
- queryClient.getQueryState(queryKey, filters)
+ queryClient.getQueryState(queryKey)
```

### The `remove` method has been removed from useQuery

Previously, remove method used to remove the query from the queryCache without informing observers about it. It was best used to remove data imperatively that is no longer needed, e.g. when logging a user out.

But It doesn't make much sense to do this while a query is still active, because it will just trigger a hard loading state with the next re-render.

if you still need to remove a query, you can use `queryClient.removeQueries({queryKey: key})`

```diff
 const queryClient = useQueryClient();
 const query = useQuery({ queryKey, queryFn });

- query.remove()
+ queryClient.removeQueries({ queryKey })
```

### The minimum required TypeScript version is now 4.7

Mainly because an important fix was shipped around type inference. Please see this [TypeScript issue](https://github.com/microsoft/TypeScript/issues/43371) for more information.

### The `isDataEqual` option has been removed from useQuery

Previously, This function was used to indicate whether to use previous `data` (`true`) or new data (`false`) as a resolved data for the query.

You can achieve the same functionality by passing a function to `structuralSharing` instead:

```diff
 import { replaceEqualDeep } from '@tanstack/react-query'

- isDataEqual: (oldData, newData) => customCheck(oldData, newData)
+ structuralSharing: (oldData, newData) => customCheck(oldData, newData) ? oldData : replaceEqualDeep(oldData, newData)
```

### The deprecated custom logger has been removed

Custom loggers were already deprecated in 4 and have been removed in this version. Logging only had an effect in development mode, where passing a custom logger is not necessary.

### Supported Browsers

We have updated our browserslist to produce a more modern, performant and smaller bundle. You can read about the requirements [here](../installation#requirements).

### Private class fields and methods

TanStack Query has always had private fields and methods on classes, but they weren't really private - they were just private in `TypeScript`. We now use [ECMAScript Private class features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields), which means those fields are now truly private and can't be accessed from the outside at runtime.

### Rename `cacheTime` to `gcTime`

Almost everyone gets `cacheTime` wrong. It sounds like "the amount of time that data is cached for", but that is not correct.

`cacheTime` does nothing as long as a query is still in used. It only kicks in as soon as the query becomes unused. After the time has passed, data will be "garbage collected" to avoid the cache from growing.

`gc` is referring to "garbage collect" time. It's a bit more technical, but also a quite [well known abbreviation](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) in computer science.

```diff
const MINUTE = 1000 * 60;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
-      cacheTime: 10 * MINUTE,
+      gcTime: 10 * MINUTE,
    },
  },
})
```

### The `useErrorBoundary` option has been renamed to `throwErrors`

To make the `useErrorBoundary` option more framework-agnostic and avoid confusion with the established React function prefix "`use`" for hooks and the "ErrorBoundary" component name, it has been renamed to `throwErrors` to more accurately reflect its functionality.

### `Error` is now the default type for errors instead of `unknown`

Even though in JavaScript, you can `throw` anything (which makes `unknown` the most correct type), almost always, `Errors` (or subclasses of `Error`) are thrown. This change makes it easier to work with the `error` field in TypeScript for most cases.

If you want to throw something that isn't an Error, you'll now have to set the generic for yourself:

```ts
useQuery<number, string>({
  queryKey: ['some-query'],
  queryFn: async () => {
    if (Math.random() > 0.5) {
      throw 'some error'
    }
    return 42
  },
})
```

### eslint `prefer-query-object-syntax` rule is removed

Since the only supported syntax now is the object syntax, this rule is no longer needed

### Removed `keepPreviousData` in favor of `placeholderData` identity function

We have removed the `keepPreviousData` option and `isPreviousData` flag as they were doing mostly the same thing as `placeholderData` and `isPlaceholderData` flag.

To achieve the same functionality as `keepPreviousData`, we have added previous query `data` as an argument to `placeholderData` function.
Therefore you just need to provide an identity function to `placeholderData` or use `keepPreviousData` function returned from Tanstack Query.

> A note here is that `useQueries` would not receive `previousData` in the `placeholderData` function as argument. This is due to a dynamic nature of queries passed in the array, which may lead to a different shape of result from placeholder and queryFn.

```diff
const {
   data,
-  isPreviousData,
+  isPlaceholderData,
} = useQuery({
  queryKey,
  queryFn,
- keepPreviousData: true,
+ placeholderData: keepPreviousData
});
```

There are some caveats to this change however, which you must be aware of:

- `placeholderData` will always put you into `success` state, while `keepPreviousData` gave you the status of the previous query. That status could be `error` if we have data fetched successfully and then got a background refetch error. However, the error itself was not shared, so we decided to stick with behavior of `placeholderData`.
- `keepPreviousData` gave you the `dataUpdatedAt` timestamp of the previous data, while with `placeholderData`, `dataUpdatedAt` will stay at `0`. This might be annoying if you want to show that timestamp continuously on screen. However you might get around it with `useEffect`.

  ```ts
  const [updatedAt, setUpdatedAt] = useState(0)

  const { data, dataUpdatedAt } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page),
  })

  useEffect(() => {
    if (dataUpdatedAt > updatedAt) {
      setUpdatedAt(dataUpdatedAt)
    }
  }, [dataUpdatedAt])
  ```

### Window focus refetching no longer listens to the `focus` event

The `visibilitychange` event is used exclusively now. This is possible because we only support browsers that support the `visibilitychange` event. This fixes a bunch of issues [as listed here](https://github.com/TanStack/query/pull/4805).

### Removed custom `context` prop in favor of custom `queryClient` instance

In v4, we introduced the possibility to pass a custom `context` to all react-query hooks. This allowed for proper isolation when using MicroFrontends.

However, `context` is a react-only feature. All that `context` does is give us access to the `queryClient`. We could achieve the same isolation by allowing to pass in a custom `queryClient` directly.
This in turn will enable other frameworks to have the same functionality in a framework-agnostic way.

```diff
import { queryClient } from './my-client'

const { data } = useQuery(
   {
    queryKey: ['users', id],
    queryFn: () => fetch(...),
-   context: customContext
  },
+  queryClient,
)
```

[//]: # 'FrameworkBreakingChanges'

## React Query Breaking Changes

### The `contextSharing` prop has been removed from QueryClientProvider

You could previously use the `contextSharing` property to share the first (and at least one) instance of the query client context across the window. This ensured that if TanStack Query was used across different bundles or microfrontends then they will all use the same instance of the context, regardless of module scoping.

However, isolation is often preferred for microfrontends. In v4 the option to pass a custom context to the `QueryClientProvider` was added, which allows exactly this. If you wish to use the same query client across multiple packages of an application, you can create a `QueryClient` in your application and then let the bundles share this through the `context` property of the `QueryClientProvider`.

### No longer using `unstable_batchedUpdates` as the batching function in React and React Native

Since the function `unstable_batchedUpdates` is noop in React 18, it will no longer be automatically set as the batching function in `react-query`.

If your framework supports a custom batching function, you can let TanStack Query know about it by calling `notifyManager.setBatchNotifyFunction`.

For example, this is how the batch function is set in `solid-query`:

```ts
import { notifyManager } from '@tanstack/query-core'
import { batch } from 'solid-js'

notifyManager.setBatchNotifyFunction(batch)
```

### `Hydrate` has been renamed to `HydrationBoundary` and the `useHydrate` hook has been removed

The `Hydrate` component has been renamed to `HydrationBoundary`. The `Hydrate` component was also a wrapper over `useHydrate` hook, which has been removed.

```diff
- import { Hydrate } from '@tanstack/react-query'
+ import { HydrationBoundary } from '@tanstack/react-query'


- <Hydrate state={dehydratedState}>
+ <HydrationBoundary state={dehydratedState}>
  <App />
- </Hydrate>
+ </HydrationBoundary>
```

[//]: # 'FrameworkBreakingChanges'
