---
id: HydrationBoundaryProps
title: HydrationBoundaryProps
---

Defined in: [packages/react-query/src/HydrationBoundary.tsx:16](https://github.com/TanStack/query/blob/main/packages/react-query/src/HydrationBoundary.tsx#L16)

The props accepted by `HydrationBoundary`.

## Properties

### children?

```ts
optional children: ReactNode;
```

Defined in: [packages/react-query/src/HydrationBoundary.tsx:36](https://github.com/TanStack/query/blob/main/packages/react-query/src/HydrationBoundary.tsx#L36)

The components to render — always rendered unconditionally, not gated on hydration. New queries are
hydrated into the cache during render; for queries that already exist in the cache, only newer dehydrated
data is hydrated, and that happens in an effect after commit, so `children` may render briefly before it
lands.

***

### options?

```ts
optional options: OmitKeyof<HydrateOptions, "defaultOptions"> & object;
```

Defined in: [packages/react-query/src/HydrationBoundary.tsx:24](https://github.com/TanStack/query/blob/main/packages/react-query/src/HydrationBoundary.tsx#L24)

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

Defined in: [packages/react-query/src/HydrationBoundary.tsx:40](https://github.com/TanStack/query/blob/main/packages/react-query/src/HydrationBoundary.tsx#L40)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will be used.

***

### state

```ts
state: DehydratedState | null | undefined;
```

Defined in: [packages/react-query/src/HydrationBoundary.tsx:20](https://github.com/TanStack/query/blob/main/packages/react-query/src/HydrationBoundary.tsx#L20)

The state to hydrate.
