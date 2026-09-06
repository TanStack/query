---
id: DistributiveOmit
title: DistributiveOmit
---

```ts
type DistributiveOmit<TObject, TKey> = TObject extends any ? Omit<TObject, TKey> : never;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:10

## Type Parameters

### TObject

`TObject`

### TKey

`TKey` *extends* keyof `TObject`
