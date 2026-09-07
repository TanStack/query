---
id: QueryResultAccessor
title: QueryResultAccessor
---

```ts
type QueryResultAccessor<TData, TError> = ValueAccessor<QueryObserverResult<TData, TError>> & object;
```

Defined in: [packages/lit-query/src/createQueryController.ts:47](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueryController.ts#L47)

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

### render()

```ts
render: <TRenderers>(renderers) => RendererResult<QueryObserverResult<TData, TError>, TRenderers>;
```

Renders the query result using the appropriate renderer from the given set, based on the result's `status`.

#### Type Parameters

##### TRenderers

`TRenderers` *extends* [`ResultRenderers`](ResultRenderers.md)\<`QueryObserverResult`\<`TData`, `TError`\>\>

#### Parameters

##### renderers

`TRenderers`

#### Returns

[`RendererResult`](RendererResult.md)\<`QueryObserverResult`\<`TData`, `TError`\>, `TRenderers`\>

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
