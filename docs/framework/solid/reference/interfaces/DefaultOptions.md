---
id: DefaultOptions
title: DefaultOptions
---

Defined in: [packages/solid-query/src/QueryClient.ts:96](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L96)

The default options a `QueryClient` applies to every query, with Solid's `reconcile` option added to
`queries`.

## Extends

- `DefaultOptions`\<`TError`\>

## Type Parameters

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

The default type of errors thrown by queries and mutations using this `QueryClient`.

## Properties

### dehydrate?

```ts
optional dehydrate: DehydrateOptions;
```

Defined in: [packages/query-core/src/types.ts:1440](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1440)

#### Inherited from

```ts
CoreDefaultOptions.dehydrate
```

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

#### Inherited from

```ts
CoreDefaultOptions.hydrate
```

***

### mutations?

```ts
optional mutations: MutationObserverOptions<unknown, TError, unknown, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1438](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1438)

#### Inherited from

```ts
CoreDefaultOptions.mutations
```

***

### queries?

```ts
optional queries: OmitKeyof<QueryObserverOptions<unknown, TError, unknown, unknown, readonly unknown[], never>, "queryKey">;
```

Defined in: [packages/solid-query/src/QueryClient.ts:99](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L99)

#### Overrides

```ts
CoreDefaultOptions.queries
```
