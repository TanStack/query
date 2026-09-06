---
id: QueryClientConfig
title: QueryClientConfig
---

Defined in: [packages/query-core/src/types.ts:1440](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1440)

## Properties

### defaultOptions?

```ts
optional defaultOptions: DefaultOptions<Error>;
```

Defined in: [packages/query-core/src/types.ts:1449](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1449)

Default options for all queries and mutations created through this client.

***

### mutationCache?

```ts
optional mutationCache: MutationCache;
```

Defined in: [packages/query-core/src/types.ts:1447](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1447)

The mutation cache this client is connected to. A new `MutationCache` is created if not
provided.

***

### queryCache?

```ts
optional queryCache: QueryCache;
```

Defined in: [packages/query-core/src/types.ts:1442](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1442)

The query cache this client is connected to. A new `QueryCache` is created if not provided.
