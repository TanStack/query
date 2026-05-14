---
id: IsFetchingAccessor
title: IsFetchingAccessor
---

# Type Alias: IsFetchingAccessor

```ts
type IsFetchingAccessor = ValueAccessor<number> & object;
```

Defined in: [packages/lit-query/src/useIsFetching.ts:17](https://github.com/TanStack/query/blob/main/packages/lit-query/src/useIsFetching.ts#L17)

Accessor returned by `useIsFetching`.

Call the accessor or read its `current` property to get the number of
currently fetching queries that match the filters.

## Type Declaration

### destroy()

```ts
destroy: () => void;
```

#### Returns

`void`
