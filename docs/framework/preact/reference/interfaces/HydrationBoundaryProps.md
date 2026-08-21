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

Defined in: [preact-query/src/HydrationBoundary.tsx:22](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L22)

***

### options?

```ts
optional options: OmitKeyof<HydrateOptions, "defaultOptions"> & object;
```

Defined in: [preact-query/src/HydrationBoundary.tsx:16](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L16)

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

Defined in: [preact-query/src/HydrationBoundary.tsx:23](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L23)

***

### state

```ts
state: DehydratedState | null | undefined;
```

Defined in: [preact-query/src/HydrationBoundary.tsx:15](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L15)
