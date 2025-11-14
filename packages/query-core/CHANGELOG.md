# @tanstack/query-core

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
