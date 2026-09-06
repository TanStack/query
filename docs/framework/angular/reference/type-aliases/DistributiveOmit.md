---
id: DistributiveOmit
title: DistributiveOmit
---

```ts
type DistributiveOmit<TObject, TKey> = TObject extends any ? Omit<TObject, TKey> : never;
```

Defined in: [packages/query-core/src/types.ts:14](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L14)

## Type Parameters

### TObject

`TObject`

### TKey

`TKey` *extends* keyof `TObject`
