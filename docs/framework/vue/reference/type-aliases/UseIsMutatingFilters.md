---
id: UseIsMutatingFilters
title: UseIsMutatingFilters
---

```ts
type UseIsMutatingFilters = VueMutationFilters | (() => VueMutationFilters);
```

Defined in: [packages/vue-query/src/useMutationState.ts:27](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L27)

The filters accepted by `useIsMutating`: [MutationFilters](../interfaces/MutationFilters.md) as a plain object, a `ref`, or a reactive
getter.
