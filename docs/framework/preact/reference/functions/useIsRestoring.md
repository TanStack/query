---
id: useIsRestoring
title: useIsRestoring
---

```ts
function useIsRestoring(): boolean;
```

Defined in: [preact-query/src/IsRestoringProvider.ts:11](https://github.com/TanStack/query/blob/main/packages/preact-query/src/IsRestoringProvider.ts#L11)

If you are using `PersistQueryClientProvider`, you can also use the `useIsRestoring` hook alongside it to
check if a restore is currently in progress. `useQuery` and friends also check this internally to avoid
race conditions between the restore and mounting queries.

## Returns

`boolean`
