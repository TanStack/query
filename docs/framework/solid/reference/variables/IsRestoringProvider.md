---
id: IsRestoringProvider
title: IsRestoringProvider
---

```ts
const IsRestoringProvider: ContextProviderComponent<Accessor<boolean>> = IsRestoringContext.Provider;
```

Defined in: [packages/solid-query/src/isRestoring.ts:18](https://github.com/TanStack/query/blob/main/packages/solid-query/src/isRestoring.ts#L18)

The Provider that `PersistQueryClientProvider` uses to signal whether a persisted client is currently
being restored, read by `useIsRestoring`.
