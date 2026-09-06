---
id: QueryClientConfig
title: QueryClientConfig
---

Defined in: [packages/query-core/src/types.ts:1495](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1495)

## Properties

### defaultOptions?

```ts
optional defaultOptions: DefaultOptions<Error>;
```

Defined in: [packages/query-core/src/types.ts:1504](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1504)

Default options for all queries and mutations created through this client.

***

### mutationCache?

```ts
optional mutationCache: MutationCache;
```

Defined in: [packages/query-core/src/types.ts:1502](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1502)

The mutation cache this client is connected to. A new `MutationCache` is created if not
provided.

***

### queryCache?

```ts
optional queryCache: QueryCache;
```

Defined in: [packages/query-core/src/types.ts:1497](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1497)

The query cache this client is connected to. A new `QueryCache` is created if not provided.
