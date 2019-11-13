# Changelog

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
