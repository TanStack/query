---
id: InfiniteQueryResultAccessor
title: InfiniteQueryResultAccessor
---

```ts
type InfiniteQueryResultAccessor<TData, TError> = ValueAccessor<InfiniteQueryObserverResult<TData, TError>> & object;
```

Defined in: [packages/lit-query/src/createInfiniteQueryController.ts:54](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createInfiniteQueryController.ts#L54)

Accessor returned by `createInfiniteQueryController`.

Call the accessor or read its `current` property to get the latest infinite
query result. The attached methods delegate to the active infinite query
observer.

## Type Declaration

### destroy()

```ts
destroy: () => void;
```

Removes the controller from its Lit host and unsubscribes observers.

#### Returns

`void`

### fetchNextPage

```ts
fetchNextPage: InfiniteQueryObserverResult<TData, TError>["fetchNextPage"];
```

Fetches the next page for the current infinite query.

### fetchPreviousPage

```ts
fetchPreviousPage: InfiniteQueryObserverResult<TData, TError>["fetchPreviousPage"];
```

Fetches the previous page for the current infinite query.

### refetch

```ts
refetch: InfiniteQueryObserverResult<TData, TError>["refetch"];
```

Refetches the current infinite query.

### render()

```ts
render: <TRenderers>(renderers) => RendererResult<InfiniteQueryObserverResult<TData, TError>, TRenderers>;
```

Renders the query result using the appropriate renderer from the given set, based on the result's `status`.

#### Type Parameters

##### TRenderers

`TRenderers` *extends* [`ResultRenderers`](ResultRenderers.md)\<`InfiniteQueryObserverResult`\<`TData`, `TError`\>\>

#### Parameters

##### renderers

`TRenderers`

#### Returns

[`RendererResult`](RendererResult.md)\<`InfiniteQueryObserverResult`\<`TData`, `TError`\>, `TRenderers`\>

## Type Parameters

### TData

`TData`

### TError

`TError`
