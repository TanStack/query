---
id: NoInfer
title: NoInfer
---

# Type Alias: NoInfer\<T\>

```ts
type NoInfer<T> = [T][T extends any ? 0 : never];
```

Defined in: [packages/query-core/src/types.ts:37](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L37)

## Type Parameters

### T

`T`
