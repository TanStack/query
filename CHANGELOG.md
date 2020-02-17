# Changelog

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
