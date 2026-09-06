---
id: replaceEqualDeep
title: replaceEqualDeep
---

```ts
function replaceEqualDeep<T>(
   a, 
   b, 
   depth?): T;
```

Defined in: [packages/query-core/src/utils.ts:339](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L339)

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
