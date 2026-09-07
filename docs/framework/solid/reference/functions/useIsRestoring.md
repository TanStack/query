---
id: useIsRestoring
title: useIsRestoring
---

```ts
function useIsRestoring(): Accessor<boolean>;
```

Defined in: [packages/solid-query/src/isRestoring.ts:13](https://github.com/TanStack/query/blob/main/packages/solid-query/src/isRestoring.ts#L13)

If you are using `PersistQueryClientProvider`, you can also use the `useIsRestoring` hook alongside it to
check if a restore is currently in progress. `useQuery` and friends also check this internally to avoid
race conditions between the restore and mounting queries.

## Returns

`Accessor`\<`boolean`\>

An accessor that reads `true` while a persisted client is being restored, `false` otherwise.
