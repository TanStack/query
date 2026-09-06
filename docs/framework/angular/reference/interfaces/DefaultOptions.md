---
id: DefaultOptions
title: DefaultOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:849

## Type Parameters

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

### dehydrate?

```ts
optional dehydrate: DehydrateOptions;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:853

***

### hydrate?

```ts
optional hydrate: object;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:852

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:851

***

### queries?

```ts
optional queries: OmitKeyof<QueryObserverOptions<unknown, TError, unknown, unknown, readonly unknown[], never>, "queryKey" | "suspense", "strictly">;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:850
