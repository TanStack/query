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

#### Overrides

```ts
QueryCoreClientConfig.defaultOptions
```

***

### mutationCache?

```ts
optional mutationCache: MutationCache;
```

Defined in: [packages/query-core/src/types.ts:1429](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1429)

#### Inherited from

```ts
QueryCoreClientConfig.mutationCache
```

***

### queryCache?

```ts
optional queryCache: QueryCache;
```

Defined in: [packages/query-core/src/types.ts:1428](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1428)

#### Inherited from

```ts
QueryCoreClientConfig.queryCache
```
