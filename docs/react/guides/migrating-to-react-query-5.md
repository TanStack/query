---
id: migrating-to-react-query-5
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

### The `contextSharing` prop has been removed from QueryClientProvider

You could previously use the `contextSharing` property to share the first (and at least one) instance of the query client context across the window. This ensured that if TanStack Query was used across different bundles or microfrontends then they will all use the same instance of the context, regardless of module scoping.

However, isolation is often preferred for microfrontends. In v4 the option to pass a custom context to the `QueryClientProvider` was added, which allows exactly this. If you wish to use the same query client across multiple packages of an application, you can create a `QueryClient` in your application and then let the bundles share this through the `context` property of the `QueryClientProvider`.

### The `isDataEqual` options has been removed from useQuery

Previously, This function was used to indicate whether to use previous `data` (`true`) or new data (`false`) as a resolved data for the query.

You can achieve the same functionality by passing a function to `structuralSharing` instead:

```diff
 import { replaceEqualDeep } from '@tanstack/react-query'

- isDataEqual: (oldData, newData) => customCheck(oldData, newData)
+ structuralSharing: (oldData, newData) => customCheck(oldData, newData) ? oldData : replaceEqualDeep(oldData, newData)
```

### The `useErrorBoundary` prop has been renamed to `throwErrors`

To make the `useErrorBoundary` prop more framework-agnostic and avoid confusion with the established React function prefix "`use`" for hooks and the "ErrorBoundary" component name, it has been renamed to `throwErrors` to more accurately reflect its functionality.

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
  }
})
```

### eslint `prefer-query-object-syntax` rule is removed

Since the only supported syntax now is the object syntax, this rule is no longer needed
