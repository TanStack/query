---
id: UseIsFetchingFilters
title: UseIsFetchingFilters
---

```ts
type UseIsFetchingFilters = 
  | MaybeRefDeep<QueryFilters>
  | (() => MaybeRefDeep<QueryFilters>);
```

Defined in: [packages/vue-query/src/useIsFetching.ts:13](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useIsFetching.ts#L13)

The filters accepted by `useIsFetching`: [QueryFilters](../interfaces/QueryFilters.md) as a plain object, a `ref`, or a reactive
getter.
