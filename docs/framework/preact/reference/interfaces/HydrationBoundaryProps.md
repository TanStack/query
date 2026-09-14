---
id: HydrationBoundaryProps
title: HydrationBoundaryProps
---

Defined in: [packages/preact-query/src/HydrationBoundary.tsx:17](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L17)

The props accepted by `HydrationBoundary`.

## Properties

### children?

```ts
optional children: ComponentChildren;
```

Defined in: [packages/preact-query/src/HydrationBoundary.tsx:37](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L37)

The components to render — always rendered unconditionally, not gated on hydration. New queries are
hydrated into the cache during render; for queries that already exist in the cache, only newer dehydrated
data is hydrated, and that happens in an effect after commit, so `children` may render briefly before it
lands.

***

### options?

```ts
optional options: OmitKeyof<HydrateOptions, "defaultOptions"> & object;
```

Defined in: [packages/preact-query/src/HydrationBoundary.tsx:25](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L25)

Optional. Note: unlike `hydrate`, `mutations` cannot be set here.

#### Type Declaration

##### defaultOptions?

```ts
optional defaultOptions: OmitKeyof<{
  deserializeData?: TransformerFn;
  mutations?: MutationOptions<unknown, Error, unknown, unknown>;
  queries?: QueryOptions<unknown, Error, unknown, readonly unknown[], never>;
}, "mutations">;
```

***

### queryClient?

```ts
optional queryClient: QueryClient;
```

Defined in: [packages/preact-query/src/HydrationBoundary.tsx:41](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L41)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will be used.

***

### state

```ts
state: DehydratedState | null | undefined;
```

Defined in: [packages/preact-query/src/HydrationBoundary.tsx:21](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L21)

The state to hydrate.
