---
id: hashKey
title: hashKey
---

```ts
function hashKey(queryKey: readonly unknown[]): string;
```

Defined in: [packages/query-core/src/utils.ts:319](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L319)

Default query & mutation keys hash function.
Hashes the value into a stable hash.

## Parameters

### queryKey

readonly `unknown`[]

The query or mutation key to hash.

## Returns

`string`

The stable hash of the key, as a JSON string.

## Example

```ts
// Object keys are sorted, so key order doesn't affect the hash:
hashKey(['todos', { page: 1, filter: 'done' }]) // === '["todos",{"filter":"done","page":1}]'
```
