---
id: ResultRenderers
title: ResultRenderers
---

```ts
type ResultRenderers<TResult> = { [K in TResult["status"]]?: (result: Extract<TResult, { status: K }>) => unknown };
```

Defined in: [packages/lit-query/src/render.ts:1](https://github.com/TanStack/query/blob/main/packages/lit-query/src/render.ts#L1)

## Type Parameters

### TResult

`TResult` *extends* `object`
