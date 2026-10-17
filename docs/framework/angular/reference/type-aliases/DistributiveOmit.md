---
id: DistributiveOmit
title: DistributiveOmit
---

```ts
type DistributiveOmit<TObject, TKey> = TObject extends any ? Omit<TObject, TKey> : never;
```

Defined in: [packages/query-core/src/types.ts:21](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L21)

Like `Omit`, but applied to each member of a union separately, so each member keeps its own keys.

## Type Parameters

### TObject

`TObject`

### TKey

`TKey` *extends* keyof `TObject`
