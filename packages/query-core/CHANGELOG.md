# @tanstack/query-core

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
