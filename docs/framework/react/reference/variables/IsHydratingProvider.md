---
id: IsHydratingProvider
title: IsHydratingProvider
---

```ts
const IsHydratingProvider: Provider<ReadonlySet<string>> = IsHydratingContext.Provider;
```

Defined in: [packages/react-query/src/IsHydratingProvider.ts:17](https://github.com/TanStack/query/blob/main/packages/react-query/src/IsHydratingProvider.ts#L17)

The Provider that `HydrationBoundary` uses to share the hashes of the queries pending hydration, read by
`useIsHydrating`.
