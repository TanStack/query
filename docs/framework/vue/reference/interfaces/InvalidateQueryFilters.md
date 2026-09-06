---
id: InvalidateQueryFilters
title: InvalidateQueryFilters
---

Defined in: [packages/query-core/src/types.ts:690](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L690)

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

Defined in: [packages/query-core/src/utils.ts:39](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L39)

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

Defined in: [packages/query-core/src/utils.ts:55](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L55)

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

Defined in: [packages/query-core/src/utils.ts:43](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L43)

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

Defined in: [packages/query-core/src/utils.ts:47](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L47)

Include queries matching this query key

#### Inherited from

```ts
QueryFilters.queryKey
```

***

### refetchType?

```ts
optional refetchType: QueryTypeFilter | "none";
```

Defined in: [packages/query-core/src/types.ts:693](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L693)

***

### stale?

```ts
optional stale: boolean;
```

Defined in: [packages/query-core/src/utils.ts:51](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L51)

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

Defined in: [packages/query-core/src/utils.ts:35](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L35)

Filter to active queries, inactive queries or all queries

#### Inherited from

```ts
QueryFilters.type
```
