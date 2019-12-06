# Changelog

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
