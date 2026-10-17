---
id: NonUndefinedGuard
title: NonUndefinedGuard
---

```ts
type NonUndefinedGuard<T> = T extends undefined ? never : T;
```

Defined in: packages/query-core/src/types.ts:16

Excludes `undefined` from `T`. Used where a value must be defined, such as the data type that a
defined `initialData` resolves to.

## Type Parameters

### T

`T`
