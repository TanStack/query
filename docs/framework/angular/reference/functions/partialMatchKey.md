---
id: partialMatchKey
title: partialMatchKey
---

```ts
function partialMatchKey(a: readonly unknown[], b: readonly unknown[]): boolean;
```

Defined in: packages/query-core/dist-ts/src/utils.d.ts:180

Checks if key `b` partially matches with key `a`.

## Parameters

### a

readonly `unknown`[]

The key to check, e.g. a query's own key.

### b

readonly `unknown`[]

The (partial) key to match against `a`.

## Returns

`boolean`

`true` if every array element or object property in `b` matches the one at the same
position in `a`.
