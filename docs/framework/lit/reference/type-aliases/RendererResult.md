---
id: RendererResult
title: RendererResult
---

```ts
type RendererResult<TResult, TRenderers> = { [K in TResult["status"]]: TRenderers[K] extends (result: Extract<TResult, { status: K }>) => infer R ? R : undefined }[TResult["status"]];
```

Defined in: [packages/lit-query/src/render.ts:7](https://github.com/TanStack/query/blob/main/packages/lit-query/src/render.ts#L7)

## Type Parameters

### TResult

`TResult` *extends* `object`

### TRenderers

`TRenderers` *extends* [`ResultRenderers`](ResultRenderers.md)\<`TResult`\>
