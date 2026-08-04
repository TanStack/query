---
id: HydrationBoundaryProps
title: HydrationBoundaryProps
---

# Interface: HydrationBoundaryProps

Defined in: packages/octane-query/src/types.ts:260

## Properties

### children?

```ts
optional children: unknown;
```

Defined in: packages/octane-query/src/types.ts:268

***

### options?

```ts
optional options: OmitKeyof<HydrateOptions, "defaultOptions"> & object;
```

Defined in: packages/octane-query/src/types.ts:262

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

Defined in: packages/octane-query/src/types.ts:269

***

### state

```ts
state: DehydratedState | null | undefined;
```

Defined in: packages/octane-query/src/types.ts:261
