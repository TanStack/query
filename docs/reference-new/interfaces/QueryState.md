---
id: QueryState
title: QueryState
---

# Interface: QueryState\<TData, TError\>

Defined in: [packages/query-core/src/query.ts:48](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L48)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

### data

```ts
data: TData | undefined;
```

Defined in: [packages/query-core/src/query.ts:49](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L49)

***

### dataUpdateCount

```ts
dataUpdateCount: number;
```

Defined in: [packages/query-core/src/query.ts:50](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L50)

***

### dataUpdatedAt

```ts
dataUpdatedAt: number;
```

Defined in: [packages/query-core/src/query.ts:51](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L51)

***

### error

```ts
error: TError | null;
```

Defined in: [packages/query-core/src/query.ts:52](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L52)

***

### errorUpdateCount

```ts
errorUpdateCount: number;
```

Defined in: [packages/query-core/src/query.ts:53](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L53)

***

### errorUpdatedAt

```ts
errorUpdatedAt: number;
```

Defined in: [packages/query-core/src/query.ts:54](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L54)

***

### fetchFailureCount

```ts
fetchFailureCount: number;
```

Defined in: [packages/query-core/src/query.ts:55](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L55)

***

### fetchFailureReason

```ts
fetchFailureReason: TError | null;
```

Defined in: [packages/query-core/src/query.ts:56](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L56)

***

### fetchMeta

```ts
fetchMeta: FetchMeta | null;
```

Defined in: [packages/query-core/src/query.ts:57](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L57)

***

### fetchStatus

```ts
fetchStatus: FetchStatus;
```

Defined in: [packages/query-core/src/query.ts:60](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L60)

***

### isInvalidated

```ts
isInvalidated: boolean;
```

Defined in: [packages/query-core/src/query.ts:58](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L58)

***

### status

```ts
status: QueryStatus;
```

Defined in: [packages/query-core/src/query.ts:59](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L59)
