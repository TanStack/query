---
id: IsMutatingAccessor
title: IsMutatingAccessor
---

# Type Alias: IsMutatingAccessor

```ts
type IsMutatingAccessor = ValueAccessor<number> & object;
```

Defined in: [packages/lit-query/src/useIsMutating.ts:17](https://github.com/TanStack/query/blob/main/packages/lit-query/src/useIsMutating.ts#L17)

Accessor returned by `useIsMutating`.

Call the accessor or read its `current` property to get the number of
currently pending mutations that match the filters.

## Type Declaration

### destroy()

```ts
destroy: () => void;
```

#### Returns

`void`
