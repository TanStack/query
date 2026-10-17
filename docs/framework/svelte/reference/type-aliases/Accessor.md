---
id: Accessor
title: Accessor
---

```ts
type Accessor<T> = () => T;
```

Defined in: [packages/svelte-query/src/types.ts:26](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L26)

A function that returns a value. Options passed as an accessor are read inside reactive contexts, so they
update when the state they read changes.

## Type Parameters

### T

`T`

## Returns

`T`
