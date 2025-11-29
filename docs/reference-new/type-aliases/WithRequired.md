---
id: WithRequired
title: WithRequired
---

# Type Alias: WithRequired\<TTarget, TKey\>

```ts
type WithRequired<TTarget, TKey> = TTarget & { [_ in TKey]: {} };
```

Defined in: [packages/query-core/src/types.ts:443](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L443)

## Type Parameters

### TTarget

`TTarget`

### TKey

`TKey` *extends* keyof `TTarget`
