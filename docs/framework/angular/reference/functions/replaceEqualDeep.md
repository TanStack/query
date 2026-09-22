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

Defined in: packages/query-core/dist-ts/src/utils.d.ts:143

This function returns `a` if `b` is deeply equal.
If not, it will replace any deeply equal children of `b` with those of `a`.
This can be used for structural sharing between JSON values for example.

## Type Parameters

### T

`T`

## Parameters

### a

`unknown`

### b

`T`

### depth?

`number`

## Returns

`T`
