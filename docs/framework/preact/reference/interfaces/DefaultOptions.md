---
id: DefaultOptions
title: DefaultOptions
---

Defined in: [packages/query-core/src/types.ts:1507](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1507)

## Type Parameters

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

### dehydrate?

```ts
optional dehydrate: DehydrateOptions;
```

Defined in: [packages/query-core/src/types.ts:1518](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1518)

Default options used when dehydrating the client's caches; see [DehydrateOptions](DehydrateOptions.md).

***

### hydrate?

```ts
optional hydrate: object;
```

Defined in: [packages/query-core/src/types.ts:1516](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1516)

Default options used when hydrating queries; see [HydrateOptions](HydrateOptions.md).

#### deserializeData?

```ts
optional deserializeData: TransformerFn;
```

Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`.

#### mutations?

```ts
optional mutations: MutationOptions<unknown, Error, unknown, unknown>;
```

Default options merged into every mutation restored from the dehydrated state.

#### queries?

```ts
optional queries: QueryOptions<unknown, Error, unknown, readonly unknown[], never>;
```

Default options merged into every query restored from the dehydrated state.

***

### mutations?

```ts
optional mutations: MutationObserverOptions<unknown, TError, unknown, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1514](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1514)

Default options applied to every mutation, unless overridden per-mutation.

***

### queries?

```ts
optional queries: OmitKeyof<QueryObserverOptions<unknown, TError, unknown, unknown, readonly unknown[], never>, "queryKey" | "suspense", "strictly">;
```

Defined in: [packages/query-core/src/types.ts:1509](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1509)

Default options applied to every query, unless overridden per-query.
