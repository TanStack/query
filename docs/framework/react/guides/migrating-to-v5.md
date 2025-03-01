---
id: migrating-to-tanstack-query-5
title: Migrating to TanStack Query v5
---

## Breaking Changes

v5 is a major version, so there are some breaking changes to be aware of:

### Supports a single signature, one object

useQuery and friends used to have many overloads in TypeScript - different ways how the function can be invoked. Not only this was tough to maintain, type wise, it also required a runtime check to see which type the first and the second parameter, to correctly create options.

now we only support the object format.

```tsx
;-useQuery(key, fn, options) + // [!code --]
  useQuery({ queryKey, queryFn, ...options }) - // [!code ++]
  useInfiniteQuery(key, fn, options) + // [!code --]
  useInfiniteQuery({ queryKey, queryFn, ...options }) - // [!code ++]
  useMutation(fn, options) + // [!code --]
  useMutation({ mutationFn, ...options }) - // [!code ++]
  useIsFetching(key, filters) + // [!code --]
  useIsFetching({ queryKey, ...filters }) - // [!code ++]
  useIsMutating(key, filters) + // [!code --]
  useIsMutating({ mutationKey, ...filters }) // [!code ++]
```

```tsx
;-queryClient.isFetching(key, filters) + // [!code --]
  queryClient.isFetching({ queryKey, ...filters }) - // [!code ++]
  queryClient.ensureQueryData(key, filters) + // [!code --]
  queryClient.ensureQueryData({ queryKey, ...filters }) - // [!code ++]
  queryClient.getQueriesData(key, filters) + // [!code --]
  queryClient.getQueriesData({ queryKey, ...filters }) - // [!code ++]
  queryClient.setQueriesData(key, updater, filters, options) + // [!code --]
  queryClient.setQueriesData({ queryKey, ...filters }, updater, options) - // [!code ++]
  queryClient.removeQueries(key, filters) + // [!code --]
  queryClient.removeQueries({ queryKey, ...filters }) - // [!code ++]
  queryClient.resetQueries(key, filters, options) + // [!code --]
  queryClient.resetQueries({ queryKey, ...filters }, options) - // [!code ++]
  queryClient.cancelQueries(key, filters, options) + // [!code --]
  queryClient.cancelQueries({ queryKey, ...filters }, options) - // [!code ++]
  queryClient.invalidateQueries(key, filters, options) + // [!code --]
  queryClient.invalidateQueries({ queryKey, ...filters }, options) - // [!code ++]
  queryClient.refetchQueries(key, filters, options) + // [!code --]
  queryClient.refetchQueries({ queryKey, ...filters }, options) - // [!code ++]
  queryClient.fetchQuery(key, fn, options) + // [!code --]
  queryClient.fetchQuery({ queryKey, queryFn, ...options }) - // [!code ++]
  queryClient.prefetchQuery(key, fn, options) + // [!code --]
  queryClient.prefetchQuery({ queryKey, queryFn, ...options }) - // [!code ++]
  queryClient.fetchInfiniteQuery(key, fn, options) + // [!code --]
  queryClient.fetchInfiniteQuery({ queryKey, queryFn, ...options }) - // [!code ++]
  queryClient.prefetchInfiniteQuery(key, fn, options) + // [!code --]
  queryClient.prefetchInfiniteQuery({ queryKey, queryFn, ...options }) // [!code ++]
```

```tsx
;-queryCache.find(key, filters) + // [!code --]
  queryCache.find({ queryKey, ...filters }) - // [!code ++]
  queryCache.findAll(key, filters) + // [!code --]
  queryCache.findAll({ queryKey, ...filters }) // [!code ++]
```

### `queryClient.getQueryData` now accepts queryKey only as an Argument

`queryClient.getQueryData` argument is changed to accept only a `queryKey`

```tsx
;-queryClient.getQueryData(queryKey, filters) + // [!code --]
  queryClient.getQueryData(queryKey) // [!code ++]
```

### `queryClient.getQueryState` now accepts queryKey only as an Argument

`queryClient.getQueryState` argument is changed to accept only a `queryKey`

```tsx
;-queryClient.getQueryState(queryKey, filters) + // [!code --]
  queryClient.getQueryState(queryKey) // [!code ++]
```

#### Codemod

To make the remove overloads migration easier, v5 comes with a codemod.

> The codemod is a best efforts attempt to help you migrate the breaking change. Please review the generated code thoroughly! Also, there are edge cases that cannot be found by the code mod, so please keep an eye on the log output.

If you want to run it against `.js` or `.jsx` files, please use the command below:

```
npx jscodeshift@latest ./path/to/src/ \
  --extensions=js,jsx \
  --transform=./node_modules/@tanstack/react-query/build/codemods/src/v5/remove-overloads/remove-overloads.cjs
```

If you want to run it against `.ts` or `.tsx` files, please use the command below:

```
npx jscodeshift@latest ./path/to/src/ \
  --extensions=ts,tsx \
  --parser=tsx \
  --transform=./node_modules/@tanstack/react-query/build/codemods/src/v5/remove-overloads/remove-overloads.cjs
```

Please note in the case of `TypeScript` you need to use `tsx` as the parser; otherwise, the codemod won't be applied properly!

**Note:** Applying the codemod might break your code formatting, so please don't forget to run `prettier` and/or `eslint` after you've applied the codemod!

A few notes about how codemod works:

- Generally, we're looking for the lucky case, when the first parameter is an object expression and contains the "queryKey" or "mutationKey" property (depending on which hook/method call is being transformed). If this is the case, your code already matches the new signature, so the codemod won't touch it. 🎉
- If the condition above is not fulfilled, then the codemod will check whether the first parameter is an array expression or an identifier that references an array expression. If this is the case, the codemod will put it into an object expression, then it will be the first parameter.
- If object parameters can be inferred, the codemod will attempt to copy the already existing properties to the newly created one.
- If the codemod cannot infer the usage, then it will leave a message on the console. The message contains the file name and the line number of the usage. In this case, you need to do the migration manually.
- If the transformation results in an error, you will also see a message on the console. This message will notify you something unexpected happened, please do the migration manually.

### Callbacks on useQuery (and QueryObserver) have been removed

`onSuccess`, `onError` and `onSettled` have been removed from Queries. They haven't been touched for Mutations. Please see [this RFC](https://github.com/TanStack/query/discussions/5279) for motivations behind this change and what to do instead.

### The `refetchInterval` callback function only gets `query` passed

This streamlines how callbacks are invoked (the `refetchOnWindowFocus`, `refetchOnMount` and `refetchOnReconnect` callbacks all only get the query passed as well), and it fixes some typing issues when callbacks get data transformed by `select`.

```tsx
- refetchInterval: number | false | ((data: TData | undefined, query: Query) => number | false | undefined) // [!code --]
+ refetchInterval: number | false | ((query: Query) => number | false | undefined) // [!code ++]
```

You can still access data with `query.state.data`, however, it will not be data that has been transformed by `select`. If you need to access the transformed data, you can call the transformation again on `query.state.data`.

### The `remove` method has been removed from useQuery

Previously, remove method used to remove the query from the queryCache without informing observers about it. It was best used to remove data imperatively that is no longer needed, e.g. when logging a user out.

But It doesn't make much sense to do this while a query is still active, because it will just trigger a hard loading state with the next re-render.

if you still need to remove a query, you can use `queryClient.removeQueries({queryKey: key})`

```tsx
const queryClient = useQueryClient()
const query = useQuery({ queryKey, queryFn })

;-query.remove() + // [!code --]
  queryClient.removeQueries({ queryKey }) // [!code ++]
```

### The minimum required TypeScript version is now 4.7

Mainly because an important fix was shipped around type inference. Please see this [TypeScript issue](https://github.com/microsoft/TypeScript/issues/43371) for more information.

### The `isDataEqual` option has been removed from useQuery

Previously, This function was used to indicate whether to use previous `data` (`true`) or new data (`false`) as a resolved data for the query.

You can achieve the same functionality by passing a function to `structuralSharing` instead:

```tsx
 import { replaceEqualDeep } from '@tanstack/react-query'

- isDataEqual: (oldData, newData) => customCheck(oldData, newData) // [!code --]
+ structuralSharing: (oldData, newData) => customCheck(oldData, newData) ? oldData : replaceEqualDeep(oldData, newData) // [!code ++]
```

### The deprecated custom logger has been removed

Custom loggers were already deprecated in 4 and have been removed in this version. Logging only had an effect in development mode, where passing a custom logger is not necessary.

### Supported Browsers

We have updated our browserslist to produce a more modern, performant and smaller bundle. You can read about the requirements [here](../../installation#requirements).

### Private class fields and methods

TanStack Query has always had private fields and methods on classes, but they weren't really private - they were just private in `TypeScript`. We now use [ECMAScript Private class features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields), which means those fields are now truly private and can't be accessed from the outside at runtime.

### Rename `cacheTime` to `gcTime`

Almost everyone gets `cacheTime` wrong. It sounds like "the amount of time that data is cached for", but that is not correct.

`cacheTime` does nothing as long as a query is still in use. It only kicks in as soon as the query becomes unused. After the time has passed, data will be "garbage collected" to avoid the cache from growing.

`gc` is referring to "garbage collect" time. It's a bit more technical, but also a quite [well known abbreviation](<https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)>) in computer science.

```tsx
const MINUTE = 1000 * 60;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
-      cacheTime: 10 * MINUTE, // [!code --]
+      gcTime: 10 * MINUTE, // [!code ++]
    },
  },
})
```

### The `useErrorBoundary` option has been renamed to `throwOnError`

To make the `useErrorBoundary` option more framework-agnostic and avoid confusion with the established React function prefix "`use`" for hooks and the "ErrorBoundary" component name, it has been renamed to `throwOnError` to more accurately reflect its functionality.

### TypeScript: `Error` is now the default type for errors instead of `unknown`

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

For a way to set a different kind of Error globally, see [the TypeScript Guide](../../typescript#registering-a-global-error).

### eslint `prefer-query-object-syntax` rule is removed

Since the only supported syntax now is the object syntax, this rule is no longer needed

### Removed `keepPreviousData` in favor of `placeholderData` identity function

We have removed the `keepPreviousData` option and `isPreviousData` flag as they were doing mostly the same thing as `placeholderData` and `isPlaceholderData` flag.

To achieve the same functionality as `keepPreviousData`, we have added previous query `data` as an argument to `placeholderData` which accepts an identity function. Therefore you just need to provide an identity function to `placeholderData` or use the included `keepPreviousData` function from Tanstack Query.

> A note here is that `useQueries` would not receive `previousData` in the `placeholderData` function as argument. This is due to a dynamic nature of queries passed in the array, which may lead to a different shape of result from placeholder and queryFn.

```tsx
import {
   useQuery,
+  keepPreviousData // [!code ++]
} from "@tanstack/react-query";

const {
   data,
-  isPreviousData, // [!code --]
+  isPlaceholderData, // [!code ++]
} = useQuery({
  queryKey,
  queryFn,
- keepPreviousData: true, // [!code --]
+ placeholderData: keepPreviousData // [!code ++]
});
```

An identity function, in the context of Tanstack Query, refers to a function that always returns its provided argument (i.e. data) unchanged.

```ts
useQuery({
  queryKey,
  queryFn,
  placeholderData: (previousData, previousQuery) => previousData, // identity function with the same behaviour as `keepPreviousData`
})
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

### Network status no longer relies on the `navigator.onLine` property

`navigator.onLine` doesn't work well in Chromium based browsers. There are [a lot of issues](https://bugs.chromium.org/p/chromium/issues/list?q=navigator.online) around false negatives, which lead to Queries being wrongfully marked as `offline`.

To circumvent this, we now always start with `online: true` and only listen to `online` and `offline` events to update the status.

This should reduce the likelihood of false negatives, however, it might mean false positives for offline apps that load via serviceWorkers, which can work even without an internet connection.

### Removed custom `context` prop in favor of custom `queryClient` instance

In v4, we introduced the possibility to pass a custom `context` to all react-query hooks. This allowed for proper isolation when using MicroFrontends.

However, `context` is a react-only feature. All that `context` does is give us access to the `queryClient`. We could achieve the same isolation by allowing to pass in a custom `queryClient` directly.
This in turn will enable other frameworks to have the same functionality in a framework-agnostic way.

```tsx
import { queryClient } from './my-client'

const { data } = useQuery(
  {
    queryKey: ['users', id],
    queryFn: () => fetch(...),
-   context: customContext // [!code --]
  },
+  queryClient, // [!code ++]
)
```

### Removed `refetchPage` in favor of `maxPages`

In v4, we introduced the possibility to define the pages to refetch for infinite queries with the `refetchPage` function.

However, refetching all pages might lead to UI inconsistencies. Also, this option is available on e.g. `queryClient.refetchQueries`, but it only does something for infinite queries, not "normal" queries.

The v5 includes a new `maxPages` option for infinite queries to limit the number of pages to store in the query data and to refetch. This new feature handles the use cases initially identified for the `refetchPage` page feature without the related issues.

### New `dehydrate` API

The options you can pass to `dehydrate` have been simplified. Queries and Mutations are always dehydrated (according to the default function implementation). To change this behaviour, instead of using the removed boolean options `dehydrateMutations` and `dehydrateQueries` you can implement the function equivalents `shouldDehydrateQuery` or `shouldDehydrateMutation` instead. To get the old behaviour of not hydrating queries/mutations at all, pass in `() => false`.

```tsx
- dehydrateMutations?: boolean // [!code --]
- dehydrateQueries?: boolean // [!code --]
```

### Infinite queries now need a `initialPageParam`

Previously, we've passed `undefined` to the `queryFn` as `pageParam`, and you could assign a default value to the `pageParam` parameter in the `queryFn` function signature. This had the drawback of storing `undefined` in the `queryCache`, which is not serializable.

Instead, you now have to pass an explicit `initialPageParam` to the infinite query options. This will be used as the `pageParam` for the first page:

```tsx
useInfiniteQuery({
   queryKey,
-  queryFn: ({ pageParam = 0 }) => fetchSomething(pageParam), // [!code --]
+  queryFn: ({ pageParam }) => fetchSomething(pageParam), // [!code ++]
+  initialPageParam: 0, // [!code ++]
   getNextPageParam: (lastPage) => lastPage.next,
})
```

### Manual mode for infinite queries has been removed

Previously, we've allowed to overwrite the `pageParams` that would be returned from `getNextPageParam` or `getPreviousPageParam` by passing a `pageParam` value directly to `fetchNextPage` or `fetchPreviousPage`. This feature didn't work at all with refetches and wasn't widely known or used. This also means that `getNextPageParam` is now required for infinite queries.

### Returning `null` from `getNextPageParam` or `getPreviousPageParam` now indicates that there is no further page available

In v4, you needed to explicitly return `undefined` to indicate that there is no further page available. We've widened this check to include `null`.

### No retries on the server

On the server, `retry` now defaults to `0` instead of `3`. For prefetching, we have always defaulted to `0` retries, but since queries that have `suspense` enabled can now execute directly on the server as well (since React18), we have to make sure that we don't retry on the server at all.

### `status: loading` has been changed to `status: pending` and `isLoading` has been changed to `isPending` and `isInitialLoading` has now been renamed to `isLoading`

The `loading` status has been renamed to `pending`, and similarly the derived `isLoading` flag has been renamed to `isPending`.

For mutations as well the `status` has been changed from `loading` to `pending` and the `isLoading` flag has been changed to `isPending`.

Lastly, a new derived `isLoading` flag has been added to the queries that is implemented as `isPending && isFetching`. This means that `isLoading` and `isInitialLoading` have the same thing, but `isInitialLoading` is deprecated now and will be removed in the next major version.

To understand the reasoning behind this change checkout the [v5 roadmap discussion](https://github.com/TanStack/query/discussions/4252).

### `hashQueryKey` has been renamed to `hashKey`

because it also hashes mutation keys and can be used inside the `predicate` functions of `useIsMutating` and `useMutationState`, which gets mutations passed.

[//]: # 'FrameworkSpecificBreakingChanges'

### The minimum required React version is now 18.0

React Query v5 requires React 18.0 or later. This is because we are using the new `useSyncExternalStore` hook, which is only available in React 18.0 and later. Previously, we have been using the shim provided by React.

### The `contextSharing` prop has been removed from QueryClientProvider

You could previously use the `contextSharing` property to share the first (and at least one) instance of the query client context across the window. This ensured that if TanStack Query was used across different bundles or microfrontends then they will all use the same instance of the context, regardless of module scoping.

With the removal of the custom context prop in v5, refer to the section on [Removed custom context prop in favor of custom queryClient instance](#removed-custom-context-prop-in-favor-of-custom-queryclient-instance). If you wish to share the same query client across multiple packages of an application, you can directly pass a shared custom `queryClient` instance.

### No longer using `unstable_batchedUpdates` as the batching function in React and React Native

Since the function `unstable_batchedUpdates` is noop in React 18, it will no longer be automatically set as the batching function in `react-query`.

If your framework supports a custom batching function, you can let TanStack Query know about it by calling `notifyManager.setBatchNotifyFunction`.

For example, this is how the batch function is set in `solid-query`:

```ts
import { notifyManager } from '@tanstack/query-core'
import { batch } from 'solid-js'

notifyManager.setBatchNotifyFunction(batch)
```

### Hydration API changes

To better support concurrent features and transitions we've made some changes to the hydration APIs. The `Hydrate` component has been renamed to `HydrationBoundary` and the `useHydrate` hook has been removed.

The `HydrationBoundary` no longer hydrates mutations, only queries. To hydrate mutations, use the low level `hydrate` API or the `persistQueryClient` plugin.

Finally, as a technical detail, the timing for when queries are hydrated have changed slightly. New queries are still hydrated in the render phase so that SSR works as usual, but any queries that already exist in the cache are now hydrated in an effect instead (as long as their data is fresher than what is in the cache). If you are hydrating just once at the start of your application as is common, this wont affect you, but if you are using Server Components and pass down fresh data for hydration on a page navigation, you might notice a flash of the old data before the page immediately rerenders.

This last change is technically a breaking one, and was made so we don't prematurely update content on the _existing_ page before a page transition has been fully committed. No action is required on your part.

```tsx
- import { Hydrate } from '@tanstack/react-query' // [!code --]
+ import { HydrationBoundary } from '@tanstack/react-query' // [!code ++]


- <Hydrate state={dehydratedState}> // [!code --]
+ <HydrationBoundary state={dehydratedState}> // [!code ++]
  <App />
- </Hydrate> // [!code --]
+ </HydrationBoundary> // [!code ++]
```

### Query defaults changes

`queryClient.getQueryDefaults` will now merge together all matching registrations instead of returning only the first matching registration.

As a result, calls to `queryClient.setQueryDefaults` should now be ordered with _increasing_ specificity.
That is, registrations should be made from the **most generic key** to the **least generic one**.

For example:

```ts
+ queryClient.setQueryDefaults(['todo'], {   // [!code ++]
+   retry: false,  // [!code ++]
+   staleTime: 60_000,  // [!code ++]
+ })  // [!code ++]
queryClient.setQueryDefaults(['todo', 'detail'], {
+   retry: true,  // [!code --]
  retryDelay: 1_000,
  staleTime: 10_000,
})
- queryClient.setQueryDefaults(['todo'], { // [!code --]
-   retry: false, // [!code --]
-   staleTime: 60_000, // [!code --]
- }) // [!code --]
```

Note that in this specific example, `retry: true` was added to the `['todo', 'detail']` registration to counteract it now inheriting `retry: false` from the more general registration. The specific changes needed to maintain exact behavior will vary depending on your defaults.

[//]: # 'FrameworkSpecificBreakingChanges'

## New Features 🚀

v5 also comes with new features:

### Simplified optimistic updates

We have a new, simplified way to perform optimistic updates by leveraging the returned `variables` from `useMutation`:

```tsx
const queryInfo = useTodos()
const addTodoMutation = useMutation({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

if (queryInfo.data) {
  return (
    <ul>
      {queryInfo.data.items.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
      {addTodoMutation.isPending && (
        <li key={String(addTodoMutation.submittedAt)} style={{ opacity: 0.5 }}>
          {addTodoMutation.variables}
        </li>
      )}
    </ul>
  )
}
```

Here, we are only changing how the UI looks when the mutation is running instead of writing data directly to the cache. This works best if we only have one place where we need to show the optimistic update. For more details, have a look at the [optimistic updates documentation](../optimistic-updates).

### Limited, Infinite Queries with new maxPages option

Infinite queries are great when infinite scroll or pagination are needed.
However, the more pages you fetch, the more memory you consume, and this also slows down the query refetching process as all the pages are sequentially refetched.

Version 5 has a new `maxPages` option for infinite queries, which allows developers to limit the number of pages that are stored in the query data and subsequently refetched.
You can adjust the `maxPages` value according to the UX and refetching performance you want to deliver.

Note that the infinite list must be bi-directional, which requires both `getNextPageParam` and `getPreviousPageParam` to be defined.

### Infinite Queries can prefetch multiple pages

Infinite Queries can be prefetched like regular Queries. Per default, only the first page of the Query will be prefetched and will be stored under the given QueryKey. If you want to prefetch more than one page, you can use the `pages` option. Read the [prefetching guide](../prefetching) for more information.

### New `combine` option for `useQueries`

See the [useQueries docs](../../reference/useQueries#combine) for more details.

### Experimental `fine grained storage persister`

See the [experimental_createPersister docs](../../../react/plugins/createPersister) for more details.

[//]: # 'FrameworkSpecificNewFeatures'

### Typesafe way to create Query Options

See the [TypeScript docs](../../typescript#typing-query-options) for more details.

### new hooks for suspense

With v5, suspense for data fetching finally becomes "stable". We've added dedicated `useSuspenseQuery`, `useSuspenseInfiniteQuery` and `useSuspenseQueries` hooks. With these hooks, `data` will never be potentially `undefined` on type level:

```js
const { data: post } = useSuspenseQuery({
  // ^? const post: Post
  queryKey: ['post', postId],
  queryFn: () => fetchPost(postId),
})
```

The experimental `suspense: boolean` flag on the query hooks has been removed.

You can read more about them in the [suspense docs](../suspense).

[//]: # 'FrameworkSpecificNewFeatures'
