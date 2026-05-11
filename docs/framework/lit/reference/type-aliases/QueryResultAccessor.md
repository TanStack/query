---
id: QueryResultAccessor
title: QueryResultAccessor
---

# Type Alias: QueryResultAccessor\<TData, TError\>

```ts
type QueryResultAccessor<TData, TError> = ValueAccessor<QueryObserverResult<TData, TError>> & object;
```

Defined in: [packages/lit-query/src/createQueryController.ts:41](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueryController.ts#L41)

Accessor returned by `createQueryController`.

Call the accessor or read its `current` property to get the latest query
result. The attached methods delegate to the active query observer.

## Type Declaration

### destroy()

```ts
destroy: () => void;
```

Removes the controller from its Lit host and unsubscribes observers.

#### Returns

`void`

### refetch

```ts
refetch: QueryObserverResult<TData, TError>["refetch"];
```

Refetches the current query.

### suspense()

```ts
suspense: () => Promise<QueryObserverResult<TData, TError>>;
```

Resolves with an optimistic query result, fetching first when needed.

#### Returns

`Promise`\<`QueryObserverResult`\<`TData`, `TError`\>\>

## Type Parameters

### TData

`TData`

### TError

`TError`
