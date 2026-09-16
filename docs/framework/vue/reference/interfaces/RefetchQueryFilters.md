---
id: RefetchQueryFilters
title: RefetchQueryFilters
---

Defined in: [packages/query-core/src/types.ts:730](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L730)

Filters used to select queries, for example in `queryClient.getQueriesData` or `queryClient.invalidateQueries`.
All provided filters must match; filters that are left unspecified are ignored.

## Extends

- [`QueryFilters`](QueryFilters.md)\<`TQueryKey`\>

## Type Parameters

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

## Properties

### exact?

```ts
optional exact: boolean;
```

Defined in: [packages/query-core/src/utils.ts:41](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L41)

Match query key exactly

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`exact`](QueryFilters.md#exact)

***

### fetchStatus?

```ts
optional fetchStatus: FetchStatus;
```

Defined in: [packages/query-core/src/utils.ts:57](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L57)

Include queries matching their fetchStatus

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`fetchStatus`](QueryFilters.md#fetchstatus)

***

### predicate()?

```ts
optional predicate: (query) => boolean;
```

Defined in: [packages/query-core/src/utils.ts:45](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L45)

Include queries matching this predicate function

#### Parameters

##### query

[`Query`](../classes/Query.md)

#### Returns

`boolean`

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`predicate`](QueryFilters.md#predicate)

***

### queryKey?

```ts
optional queryKey: TQueryKey | TuplePrefixes<TQueryKey>;
```

Defined in: [packages/query-core/src/utils.ts:49](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L49)

Include queries matching this query key

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`queryKey`](QueryFilters.md#querykey)

***

### stale?

```ts
optional stale: boolean;
```

Defined in: [packages/query-core/src/utils.ts:53](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L53)

Include or exclude stale queries

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`stale`](QueryFilters.md#stale)

***

### type?

```ts
optional type: QueryTypeFilter;
```

Defined in: [packages/query-core/src/utils.ts:37](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L37)

Filter to active queries, inactive queries or all queries

Defaults to `'all'`.

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`type`](QueryFilters.md#type)
