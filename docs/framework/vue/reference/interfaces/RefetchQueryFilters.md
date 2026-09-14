---
id: RefetchQueryFilters
title: RefetchQueryFilters
---

Defined in: [packages/query-core/src/types.ts:730](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L730)

## Extends

- `QueryFilters`\<`TQueryKey`\>

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

```ts
QueryFilters.exact
```

***

### fetchStatus?

```ts
optional fetchStatus: FetchStatus;
```

Defined in: [packages/query-core/src/utils.ts:57](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L57)

Include queries matching their fetchStatus

#### Inherited from

```ts
QueryFilters.fetchStatus
```

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

```ts
QueryFilters.predicate
```

***

### queryKey?

```ts
optional queryKey: TQueryKey | TuplePrefixes<TQueryKey>;
```

Defined in: [packages/query-core/src/utils.ts:49](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L49)

Include queries matching this query key

#### Inherited from

```ts
QueryFilters.queryKey
```

***

### stale?

```ts
optional stale: boolean;
```

Defined in: [packages/query-core/src/utils.ts:53](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L53)

Include or exclude stale queries

#### Inherited from

```ts
QueryFilters.stale
```

***

### type?

```ts
optional type: QueryTypeFilter;
```

Defined in: [packages/query-core/src/utils.ts:37](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L37)

Filter to active queries, inactive queries or all queries

Defaults to `'all'`.

#### Inherited from

```ts
QueryFilters.type
```
