---
id: QueryClientConfig
title: QueryClientConfig
---

Defined in: [packages/query-core/src/types.ts:1475](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1475)

## Properties

### defaultOptions?

```ts
optional defaultOptions: DefaultOptions<Error>;
```

Defined in: [packages/query-core/src/types.ts:1484](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1484)

Default options for all queries and mutations created through this client.

***

### mutationCache?

```ts
optional mutationCache: MutationCache;
```

Defined in: [packages/query-core/src/types.ts:1482](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1482)

The mutation cache this client is connected to. A new `MutationCache` is created if not
provided.

***

### queryCache?

```ts
optional queryCache: QueryCache;
```

Defined in: [packages/query-core/src/types.ts:1477](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1477)

The query cache this client is connected to. A new `QueryCache` is created if not provided.
