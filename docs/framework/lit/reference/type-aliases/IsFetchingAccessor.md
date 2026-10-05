---
id: IsFetchingAccessor
title: IsFetchingAccessor
---

```ts
type IsFetchingAccessor = ValueAccessor<number> & {
  destroy: () => void;
};
```

Defined in: [packages/lit-query/src/useIsFetching.ts:13](https://github.com/TanStack/query/blob/main/packages/lit-query/src/useIsFetching.ts#L13)

Accessor returned by `useIsFetching`.

Call the accessor or read its `current` property to get the number of
currently fetching queries that match the filters.

## Type Declaration

### destroy

```ts
destroy: () => void;
```

#### Returns

`void`
