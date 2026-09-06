---
id: InvalidateQueryFilters
title: InvalidateQueryFilters
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:351

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

Defined in: packages/query-core/dist-ts/src/utils.d.ts:21

Match query key exactly

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`exact`](QueryFilters.md#exact)

***

### fetchStatus?

```ts
optional fetchStatus: FetchStatus;
```

Defined in: packages/query-core/dist-ts/src/utils.d.ts:37

Include queries matching their fetchStatus

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`fetchStatus`](QueryFilters.md#fetchstatus)

***

### predicate()?

```ts
optional predicate: (query) => boolean;
```

Defined in: packages/query-core/dist-ts/src/utils.d.ts:25

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

Defined in: packages/query-core/dist-ts/src/utils.d.ts:29

Include queries matching this query key

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`queryKey`](QueryFilters.md#querykey)

***

### refetchType?

```ts
optional refetchType: QueryTypeFilter | "none";
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:352

***

### stale?

```ts
optional stale: boolean;
```

Defined in: packages/query-core/dist-ts/src/utils.d.ts:33

Include or exclude stale queries

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`stale`](QueryFilters.md#stale)

***

### type?

```ts
optional type: QueryTypeFilter;
```

Defined in: packages/query-core/dist-ts/src/utils.d.ts:17

Filter to active queries, inactive queries or all queries

#### Inherited from

[`QueryFilters`](QueryFilters.md).[`type`](QueryFilters.md#type)
