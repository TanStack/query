---
id: QueryClientConfig
title: QueryClientConfig
---

Defined in: [packages/solid-query/src/QueryClient.ts:105](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L105)

The config accepted by `new QueryClient(config)`, with Solid's extended [DefaultOptions](DefaultOptions.md).

## Extends

- `QueryClientConfig`

## Properties

### defaultOptions?

```ts
optional defaultOptions: DefaultOptions<Error>;
```

Defined in: [packages/solid-query/src/QueryClient.ts:106](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L106)

Default options for all queries and mutations created through this client.

#### Overrides

```ts
QueryCoreClientConfig.defaultOptions
```

***

### mutationCache?

```ts
optional mutationCache: MutationCache;
```

Defined in: [packages/query-core/src/types.ts:1502](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1502)

The mutation cache this client is connected to. A new `MutationCache` is created if not
provided.

#### Inherited from

```ts
QueryCoreClientConfig.mutationCache
```

***

### queryCache?

```ts
optional queryCache: QueryCache;
```

Defined in: [packages/query-core/src/types.ts:1497](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1497)

The query cache this client is connected to. A new `QueryCache` is created if not provided.

#### Inherited from

```ts
QueryCoreClientConfig.queryCache
```
