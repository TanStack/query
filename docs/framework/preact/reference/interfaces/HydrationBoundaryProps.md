---
id: HydrationBoundaryProps
title: HydrationBoundaryProps
---

Defined in: [preact-query/src/HydrationBoundary.tsx:14](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L14)

## Properties

### children?

```ts
optional children: ComponentChildren;
```

Defined in: [preact-query/src/HydrationBoundary.tsx:34](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L34)

The components to render — always rendered unconditionally, not gated on hydration. New queries are
hydrated into the cache during render; for queries that already exist in the cache, only newer dehydrated
data is hydrated, and that happens in an effect after commit, so `children` may render briefly before it
lands.

***

### options?

```ts
optional options: OmitKeyof<HydrateOptions, "defaultOptions"> & object;
```

Defined in: [preact-query/src/HydrationBoundary.tsx:22](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L22)

Optional. Note: unlike `hydrate`, `mutations` cannot be set here.

#### Type Declaration

##### defaultOptions?

```ts
optional defaultOptions: OmitKeyof<{
}, "mutations">;
```

***

### queryClient?

```ts
optional queryClient: QueryClient;
```

Defined in: [preact-query/src/HydrationBoundary.tsx:38](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L38)

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.

***

### state

```ts
state: DehydratedState | null | undefined;
```

Defined in: [preact-query/src/HydrationBoundary.tsx:18](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L18)

The state to hydrate.
