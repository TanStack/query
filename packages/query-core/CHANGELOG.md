# @tanstack/query-core

## 5.100.1

### Patch Changes

- Fix bugs where hydrating queries with promises that had already resolved could cause queries to briefly and incorrectly show as pending/fetching ([#10444](https://github.com/TanStack/query/pull/10444))

## 5.100.0

### Minor Changes

- feat(query-core): accept callback function for retryOnMount ([#10515](https://github.com/TanStack/query/pull/10515))

## 5.99.2

## 5.99.1

## 5.99.0

## 5.98.0

## 5.97.0

### Patch Changes

- fix(query-core): use explicit `undefined` check for timer IDs so that custom `TimeoutProvider`s returning `0` as a valid timer ID are properly cleared ([#10401](https://github.com/TanStack/query/pull/10401))

## 5.96.2

## 5.96.1

## 5.96.0

## 5.95.2

### Patch Changes

- fix(timeoutManager): make sure NodeJs.Timout doesn't leak ([#10325](https://github.com/TanStack/query/pull/10325))

## 5.95.1

### Patch Changes

- fix(timeoutManager): make sure NodeJs.Timout doesn't leak ([#10323](https://github.com/TanStack/query/pull/10323))

## 5.95.0

## 5.94.5

### Patch Changes

- fix(\*): resolve issue about excluded build directory ([#10312](https://github.com/TanStack/query/pull/10312))

## 5.94.4

### Patch Changes

- chore: fixed version ([#10064](https://github.com/TanStack/query/pull/10064))

## 5.91.2

### Patch Changes

- fix(streamedQuery): maintain error state on reset refetch with initialData defined ([#10287](https://github.com/TanStack/query/pull/10287))

## 5.91.1

### Patch Changes

- fix(core): cancel paused initial fetch when last observer unsubscribes ([#10291](https://github.com/TanStack/query/pull/10291))

## 5.91.0

### Minor Changes

- feat: environmentManager ([#10199](https://github.com/TanStack/query/pull/10199))

## 5.90.20

### Patch Changes

- Fix: onMutate callback now runs synchronously when mutationCache.config.onMutate is not defined ([#10066](https://github.com/TanStack/query/pull/10066))

## 5.90.19

### Patch Changes

- fix stable combine reference not updating when queries change dynamically ([#9954](https://github.com/TanStack/query/pull/9954))

## 5.90.18

### Patch Changes

- Align experimental_prefetchInRender promise rejection with Suspense behavior by only throwing when no data is available. ([#10025](https://github.com/TanStack/query/pull/10025))

## 5.90.17

### Patch Changes

- fix(query-core): replaceEqualDeep max depth ([#10032](https://github.com/TanStack/query/pull/10032))

## 5.90.16

### Patch Changes

- fix useQueries race condition on queries length change (#9971) ([#9973](https://github.com/TanStack/query/pull/9973))

## 5.90.15

### Patch Changes

- Fix: Always treat existing data as stale when query goes into error state. ([#9927](https://github.com/TanStack/query/pull/9927))

## 5.90.14

### Patch Changes

- Fix streamedQuery reducer being called twice ([#9970](https://github.com/TanStack/query/pull/9970))

## 5.90.13

### Patch Changes

- Made context.signal consume aware with streamedQuery ([#9963](https://github.com/TanStack/query/pull/9963))

## 5.90.12

### Patch Changes

- fix: update react and nextJs ([#9944](https://github.com/TanStack/query/pull/9944))

## 5.90.11

### Patch Changes

- Prevent infinite render loops when useSuspenseQueries has duplicate queryKeys ([#9886](https://github.com/TanStack/query/pull/9886))

## 5.90.10

### Patch Changes

- fix(types): allow QueryFilters union with different lengths ([#9878](https://github.com/TanStack/query/pull/9878))

- Fix streamedQuery to avoid returning undefined when the stream yields no values ([#9876](https://github.com/TanStack/query/pull/9876))

## 5.90.9

### Patch Changes

- fix(types): do not drop readonly for partial QueryFilter matching ([#9872](https://github.com/TanStack/query/pull/9872))

## 5.90.8

### Patch Changes

- fix: allow partial query keys in `QueryFilters` ([#9686](https://github.com/TanStack/query/pull/9686))

## 5.90.7

### Patch Changes

- fix(core): only attach .then and .catch onto a promise if it gets dehydrated ([#9847](https://github.com/TanStack/query/pull/9847))

## 5.90.6

### Patch Changes

- Fixed isFetchedAfterMount in cases where initialData is applied ([#9743](https://github.com/TanStack/query/pull/9743))

## 5.90.5

### Patch Changes

- fix: observing "promise" needs to implicitly observe "data" ([#9772](https://github.com/TanStack/query/pull/9772))

## 5.90.4

### Patch Changes

- fix(types): remove duplicate Array condition in MutationKey type ([#9754](https://github.com/TanStack/query/pull/9754))

## 5.90.3

### Patch Changes

- Avoid unhandled promise rejection errors during de/rehydration of pending queries. ([#9752](https://github.com/TanStack/query/pull/9752))
