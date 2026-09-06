---
id: IsRestoringProvider
title: IsRestoringProvider
---

```ts
const IsRestoringProvider: Provider<boolean> = IsRestoringContext.Provider;
```

Defined in: [packages/react-query/src/IsRestoringProvider.ts:19](https://github.com/TanStack/query/blob/main/packages/react-query/src/IsRestoringProvider.ts#L19)

The Provider that `PersistQueryClientProvider` uses to signal whether a persisted client is currently
being restored, read by `useIsRestoring`.
