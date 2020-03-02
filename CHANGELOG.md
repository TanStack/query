# Changelog

## 1.0.8

- Fixed an issue where query retries would not continue firing if the page was unfocused and refocused again

## 1.0.8

- Fixed an issue where `useIsFetching` would not read properly from the query cache
- Fixed an issue where `queryCache.setQueryCache` would not match multiple queries and would not partially match queries
- Removed some unused code from the codebase

## 1.0.7

- Fixed an issue where failed queries with no data could be unintentionally garbage collected immediately
- Fixed an issue where queries with falsey query keys would initialize to `loading` instead of `success`

## 1.0.6

- Fixed an issue where paginated queries, when updated rapidly, would display an unnecessary loading state.

## 1.0.5

- Fixed a regression where query errors were not thrown properly
- Fixed an issue where the `mutate` function returned from `useMutation` was not memoized properly

## 1.0.4

- Silently remove the `query.state.isInactive` boolean. If you somehow relied on this state, then you can still derive it using `const isInactive = !query.instances.length`

## 1.0.3

- Fixed an issue where the first query rendered on the page would always remount due to a bug in the `useUid` hook
- Fixed an issue where queries were still refetching on mount if `manual` was `true`
- Optimized garbage collection for queries that have no data so they will be removed immediately
- Fixed a potential issue where returned promises in try/catch blocks were not always awaited, yet still worked usually.
- Fixed a potential issue where a query function that had already been settled would get it's `cancel` function called.

## 1.0.2

- Fixed an issue where React Native would try and call `window.addEventListener`
- Fixed an issue where `setConsole` was not exported

## 1.0.1

- Removed outdated external types dependency

## 1.0.0

**Features & Enhancements**

- `usePaginatedQuery` - A dedicated hook for window-like querying of paginated data or cursor-driven batches of data
- `useInfiniteQuery` - A dedicated hook for accumulative querying of paginated data or cursor-driven batches of data
- Synchronous Query Cache Reads/Writes/Upserts/Deletes
- Improved query key matching for removing and refetching queries
- External subscriptions to query cache updates
- Unlimited query key length support
- Optional Query Variables
- `onSettled` callback for query and mutation hooks
- `onSuccess` and `onError` callbacks for mutations
- Better SSR support via `config.initialData`
- `config.initialData` now supports passing an initializer function, similar to React.useState
- Query status is now automatically inferred based on `initialData` (`success` for non-`undefined` intitial data, `loading` for `undefined` intitial data)
- Query objects now supply an `updatedAt` property for making better informed decisions about synchronous cache usage
- Overall, less over-fetching out of the box when using multiple instances of a query.
- Added a new `config.refetchOnMount` that defaults to `true` and when set to `false` will disable additional instances of a query to trigger background refetches.
- More reliable suspense support for prefetched queries and background refetching lifecycles
- Support for errorBoundaries out of the box when using Suspense for both queries and mutations
- Added a `globalConfig.queryFnParamsFilter` function that allows filtering the parameters that get sent to the query function.

**Breaking Changes**

- Query Keys and Query functions
  - Query keys in array form are no longer limited to a `[String, Object]` tuple, but can have as many serializable items in them as necessary.
  - Query functions now receive **all** query key items as parameters (before they only recieved a single variables object if supplied)
  - Query functions can now also receive optional query variables (passed as an optional second variable to `useQuery`) as parameters. They are applied after the query key parameters
- `useQuery`
  - `paginated` has been removed in favor of the new `usePaginatedQuery` and `useInfiniteQuery` hooks. This includes the following options and methods as well:
    - `isFetchingMore`
    - `canFetchMore`
    - `fetchMore`
- `useMutation`
  - `refetchQueries` and `updateQuery` options have been removed in favor of `onSuccess`, `onError` and `onSettled` + `queryCache.refetchQueries` and `queryCache.setQueryData`
- `prefetchQuery` has been removed in favor of `queryCache.prefetchQuery`
- `refetchQuery` has been removed in favor of `queryCache.refetchQueries`
- `refetchAllQueries` has been removed in favor of `queryCache.refetchQueries`
- `updateQuery` has been removed in favor of `queryCache.setQueryData`
- `clearQueryCache` has been removed in favor of `queryCache.clear` and `queryCache.removeQueries`
- When `initialData` now resolves to any non-`undefined` value:
  - `status` will be initially set to `success`
  - The query will not automatically refetch on mount
  - `isStale` will initially be set to `true`, and the standard staleTimeout will be applied

## 0.4.3

- Remove unrelated branch artifacts from dist folder, including types

## 0.4.2

- Added a new `setConsole` exported function that allows you replace the `console` interface used to log errors. By default, the `window.console` object is used.

## 0.4.1

- Fixed an issue where interval fetching errors would throw repeatedly

## 0.4.0

- Added the `useMutation.throwOnError` and corresponding `queryConfig.throwOnError` option to configure whether the `mutate` function rethrows errors encountered in the mutation function
- Added the `useMutation.useErrorBoundary` and corresponding `queryConfig.useErrorBoundary` option to configure whether mutation errors should be thrown during the render function and propagated to the nearest error boundary. This option will default to the same value as `queryConfig.suspense` if not defined otherwise
- Added a new `reset` function for `useMutation` which will revert the hook's state back to the initial `null` state

## 0.3.27

- Switched from the fast-async babel plugin to the babel-plugin-transform-async-to-promises. This should offer better compiler/browser support at the expense of 0.1kb

## 0.3.26

- By default the initial state for `data` is now `undefined` instead of `null`, allowing for use of default parameters in destructuring. While this may technically be a "breaking" change, it's more of a bug in spirit as it was not intended to be shipped this way. Don't like this? Become a sponsor and demand otherwise ;)

## 0.3.25

- Fixed an issue where `cancelQueries` was called while not being defined

## 0.3.24

- Fixed an issue where isDocumentVisible wasn't properly guarded against in all non-web scenarios
- Fixed an issue where query cancellation functions may not have been called
- Added the new `setFocusHandler` utility which allows the overriding of the event that triggers window focusing
- Updated the docs to show how to use `setFocusHandler` to avoid iframe events from triggerig window focus

## 0.3.23

- Fixed an issue where queries would not refresh in the background when using suspense

## 0.3.22

- Caching is now disabled when React Query is used on the server. It is still possible to seed queries using `initialData` during SSR.

## 0.3.21

- Fixed an edge case where `useIsLoading` would not update or rerender correctly.

## 0.3.20

- Added `config.refetchIntervalInBackground` option

## 0.3.19

- Added `config.initialData` option for SSR

## 0.3.18

- Fix and issue where `setQueryData` would crash when the query does not exist

## 0.3.17

- Fix and issue where queries would double fetch when using suspense

## 0.3.16

- Remove nodent runtime from react-async (shaved off 938 bytes!)

## 0.3.15

- Better esm bundle configuration

## 0.3.14

- Add `promise.cancel` support to query promises to support request cancellation APIs
- Refetch all on window focus should no longer raise unhandled promise rejections

## 0.3.13

- Fix issue where `document` was not guarded againts in React Native

## 0.3.12

- Remove orphaned npm dependencies

## 0.3.11

- Add `@types/react-query` as a dependency for typescript users

## 0.3.10

- Fix issue where window focus event would try and register in react-native

## 0.3.9

- Fix issue where variable hashes could contain arrays or similar number/string pairs
- Fix issue where clearing query cache could lead to out of date query states

## 0.3.8

- Internal cleanup and refactoring

## 0.3.7

- Added the `clearQueryCache` API function to clear the query cache

## 0.3.6

- Fixed an issue where passing `config` to `ReactQueryConfigProvider` would not update the non-hook `defaultContext`

## 0.3.5

- Fixed an issue where `isLoading` would remain `true` if a query encountered an error after all retries
- Fixed regression where `useIsFetching` stopped working

## 0.3.4

- Fixed an issue where `useMutation().mutate` would not throw an error when failing

## 0.3.3

- Fixed an issue where falsey query keys would sometimes still fetch

## 0.3.2

- Added the `useQuery.onSuccess` callback option
- Added the `useQuery.onError` callback option

## 0.3.1

- Added the `prefetchQuery` method
- Improved support for Suspense including fetch-as-you-render patterns
- Undocumented `_useQueries` hook has been removed

## 0.3.0

- The `useReactQueryConfig` hook is now a provider component called `ReactQueryConfigProvider`
