---
id: IsRestoringProvider
title: IsRestoringProvider
---

```ts
const IsRestoringProvider: ContextProviderComponent<Accessor<boolean>> = IsRestoringContext.Provider;
```

Defined in: [packages/solid-query/src/isRestoring.ts:19](https://github.com/TanStack/query/blob/main/packages/solid-query/src/isRestoring.ts#L19)

The Provider that `PersistQueryClientProvider` uses to signal whether a persisted client is currently
being restored, read by `useIsRestoring`.
