---
id: QueriesResultAccessor
title: QueriesResultAccessor
---

# Type Alias: QueriesResultAccessor\<TCombinedResult\>

```ts
type QueriesResultAccessor<TCombinedResult> = ValueAccessor<TCombinedResult> & object;
```

Defined in: [packages/lit-query/src/createQueriesController.ts:217](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueriesController.ts#L217)

Accessor returned by `createQueriesController`.

Call the accessor or read its `current` property to get the latest combined
value.

## Type Declaration

### destroy()

```ts
destroy: () => void;
```

Removes the controller from its Lit host and unsubscribes observers.

#### Returns

`void`

## Type Parameters

### TCombinedResult

`TCombinedResult`
