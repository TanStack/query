---
id: QueryFilters
title: QueryFilters
---

Defined in: [packages/query-core/src/utils.ts:31](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L31)

Filters used to select queries, for example in `queryClient.getQueriesData` or `queryClient.invalidateQueries`.
All provided filters must match; filters that are left unspecified are ignored.

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

Defined in: [packages/query-core/src/utils.ts:41](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L41)

Match query key exactly

***

### fetchStatus?

```ts
optional fetchStatus: FetchStatus;
```

Defined in: [packages/query-core/src/utils.ts:57](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L57)

Include queries matching their fetchStatus

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

***

### queryKey?

```ts
optional queryKey: TQueryKey | TuplePrefixes<TQueryKey>;
```

Defined in: [packages/query-core/src/utils.ts:49](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L49)

Include queries matching this query key

***

### stale?

```ts
optional stale: boolean;
```

Defined in: [packages/query-core/src/utils.ts:53](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L53)

Include or exclude stale queries

***

### type?

```ts
optional type: QueryTypeFilter;
```

Defined in: [packages/query-core/src/utils.ts:37](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L37)

Filter to active queries, inactive queries or all queries

Defaults to `'all'`.
