---
id: hashKey
title: hashKey
---

```ts
function hashKey(queryKey: readonly unknown[]): string;
```

Defined in: packages/query-core/dist-ts/src/utils.d.ts:133

Default query & mutation keys hash function.
Hashes the value into a stable hash.

## Parameters

### queryKey

readonly `unknown`[]

## Returns

`string`

## Example

```ts
// Object keys are sorted, so key order doesn't affect the hash:
hashKey(['todos', { page: 1, filter: 'done' }]) // === '["todos",{"filter":"done","page":1}]'
```
