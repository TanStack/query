---
id: MutationScope
title: MutationScope
---

```ts
type MutationScope = object;
```

Defined in: [packages/query-core/src/types.ts:1833](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1833)

Groups mutations so they run one after another instead of in parallel.
Mutations that share the same `id` form a queue: while one is running, the others wait in `isPaused: true`
state and resume automatically when their turn comes. Mutations with no scope always run in parallel.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | The scope's identifier. Mutations with the same `id` run one after another. |
