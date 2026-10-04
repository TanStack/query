---
id: useIsHydrating
title: useIsHydrating
---

```ts
function useIsHydrating(): ReadonlySet<string>;
```

Defined in: [packages/react-query/src/IsHydratingProvider.ts:11](https://github.com/TanStack/query/blob/main/packages/react-query/src/IsHydratingProvider.ts#L11)

Returns the hashes of the queries whose dehydrated data a `HydrationBoundary` is still waiting to hydrate.
`useQuery` and friends check this internally, so that a query pending hydration doesn't refetch on mount.

## Returns

`ReadonlySet`\<`string`\>

The hashes of the queries pending hydration, or an empty set outside a `HydrationBoundary`.
