---
id: DefaultOptions
title: DefaultOptions
---

# Interface: DefaultOptions\<TError\>

Defined in: [packages/query-core/src/types.ts:1357](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1357)

## Type Parameters

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

### dehydrate?

```ts
optional dehydrate: DehydrateOptions;
```

Defined in: [packages/query-core/src/types.ts:1364](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1364)

***

### hydrate?

```ts
optional hydrate: object;
```

Defined in: [packages/query-core/src/types.ts:1363](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1363)

#### deserializeData?

```ts
optional deserializeData: TransformerFn;
```

#### mutations?

```ts
optional mutations: MutationOptions<unknown, Error, unknown, unknown>;
```

#### queries?

```ts
optional queries: QueryOptions<unknown, Error, unknown, readonly unknown[], never>;
```

***

### mutations?

```ts
optional mutations: MutationObserverOptions<unknown, TError, unknown, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1362](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1362)

***

### queries?

```ts
optional queries: OmitKeyof<QueryObserverOptions<unknown, TError, unknown, unknown, readonly unknown[], never>, "queryKey" | "suspense", "strictly">;
```

Defined in: [packages/query-core/src/types.ts:1358](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1358)
