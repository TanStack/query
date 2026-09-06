---
id: DefaultOptions
title: DefaultOptions
---

Defined in: [packages/query-core/src/types.ts:1433](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1433)

## Type Parameters

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

### dehydrate?

```ts
optional dehydrate: DehydrateOptions;
```

Defined in: [packages/query-core/src/types.ts:1440](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1440)

***

### hydrate?

```ts
optional hydrate: object;
```

Defined in: [packages/query-core/src/types.ts:1439](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1439)

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

Defined in: [packages/query-core/src/types.ts:1438](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1438)

***

### queries?

```ts
optional queries: OmitKeyof<QueryObserverOptions<unknown, TError, unknown, unknown, readonly unknown[], never>, "queryKey" | "suspense", "strictly">;
```

Defined in: [packages/query-core/src/types.ts:1434](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1434)
