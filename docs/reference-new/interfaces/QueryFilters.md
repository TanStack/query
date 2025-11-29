---
id: QueryFilters
title: QueryFilters
---

# Interface: QueryFilters\<TQueryKey\>

Defined in: [packages/query-core/src/utils.ts:30](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L30)

## Extended by

- [`InvalidateQueryFilters`](InvalidateQueryFilters.md)
- [`RefetchQueryFilters`](RefetchQueryFilters.md)

## Type Parameters

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

## Properties

### exact?

```ts
optional exact: boolean;
```

Defined in: [packages/query-core/src/utils.ts:38](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L38)

Match query key exactly

***

### fetchStatus?

```ts
optional fetchStatus: FetchStatus;
```

Defined in: [packages/query-core/src/utils.ts:54](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L54)

Include queries matching their fetchStatus

***

### predicate()?

```ts
optional predicate: (query) => boolean;
```

Defined in: [packages/query-core/src/utils.ts:42](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L42)

Include queries matching this predicate function

#### Parameters

##### query

[`Query`](../classes/Query.md)

#### Returns

`boolean`

***

### queryKey?

```ts
optional queryKey: TQueryKey | TuplePrefixes<TQueryKey>;
```

Defined in: [packages/query-core/src/utils.ts:46](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L46)

Include queries matching this query key

***

### stale?

```ts
optional stale: boolean;
```

Defined in: [packages/query-core/src/utils.ts:50](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L50)

Include or exclude stale queries

***

### type?

```ts
optional type: QueryTypeFilter;
```

Defined in: [packages/query-core/src/utils.ts:34](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L34)

Filter to active queries, inactive queries or all queries
