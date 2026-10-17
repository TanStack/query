---
id: replaceEqualDeep
title: replaceEqualDeep
---

```ts
function replaceEqualDeep<T>(
   a: unknown, 
   b: T, 
   depth?: number): T;
```

Defined in: [packages/query-core/src/utils.ts:388](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L388)

This function returns `a` if `b` is deeply equal.
If not, it will replace any deeply equal children of `b` with those of `a`.
This can be used for structural sharing between JSON values for example.

## Type Parameters

### T

`T`

## Parameters

### a

`unknown`

The previous value, whose deeply equal parts are reused.

### b

`T`

The new value.

### depth?

`number`

The current recursion depth. Past a depth of `500`, `b` is returned as is.

## Returns

`T`

`a` if `b` is deeply equal to it, otherwise `b` with its deeply equal parts replaced by
those of `a`.
