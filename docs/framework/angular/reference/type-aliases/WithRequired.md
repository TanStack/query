---
id: WithRequired
title: WithRequired
---

```ts
type WithRequired<TTarget, TKey> = TTarget & { [_ in TKey]: {} };
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:448

Makes the `TKey` properties of `TTarget` required and non-nullable.

## Type Parameters

### TTarget

`TTarget`

### TKey

`TKey` *extends* keyof `TTarget`
