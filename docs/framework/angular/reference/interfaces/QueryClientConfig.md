---
id: QueryClientConfig
title: QueryClientConfig
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:857

## Properties

### defaultOptions?

```ts
optional defaultOptions: DefaultOptions<Error>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:866

Default options for all queries and mutations created through this client.

***

### mutationCache?

```ts
optional mutationCache: MutationCache;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:864

The mutation cache this client is connected to. A new `MutationCache` is created if not
provided.

***

### queryCache?

```ts
optional queryCache: QueryCache;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:859

The query cache this client is connected to. A new `QueryCache` is created if not provided.
