---
id: queryClientContext
title: queryClientContext
---

# Variable: queryClientContext

```ts
const queryClientContext: object;
```

Defined in: [packages/lit-query/src/context.ts:11](https://github.com/TanStack/query/blob/main/packages/lit-query/src/context.ts#L11)

Lit context key used by `QueryClientProvider` and host-bound APIs to share a
`QueryClient` through the DOM tree.

Most applications use `QueryClientProvider` instead of interacting with this
context directly.
