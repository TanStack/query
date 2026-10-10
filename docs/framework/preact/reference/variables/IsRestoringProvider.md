---
id: IsRestoringProvider
title: IsRestoringProvider
---

```ts
const IsRestoringProvider: Provider<boolean> = IsRestoringContext.Provider;
```

Defined in: [packages/preact-query/src/IsRestoringProvider.ts:18](https://github.com/TanStack/query/blob/main/packages/preact-query/src/IsRestoringProvider.ts#L18)

The Provider that `PersistQueryClientProvider` uses to signal whether a persisted client is currently
being restored, read by `useIsRestoring`.
