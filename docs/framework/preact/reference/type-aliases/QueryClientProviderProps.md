---
id: QueryClientProviderProps
title: QueryClientProviderProps
---

```ts
type QueryClientProviderProps = object;
```

Defined in: [preact-query/src/QueryClientProvider.tsx:34](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryClientProvider.tsx#L34)

## Properties

### children?

```ts
optional children: ComponentChildren;
```

Defined in: [preact-query/src/QueryClientProvider.tsx:44](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryClientProvider.tsx#L44)

The components that get access to the provided QueryClient.

***

### client

```ts
client: QueryClient;
```

Defined in: [preact-query/src/QueryClientProvider.tsx:40](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryClientProvider.tsx#L40)

**Required**

The QueryClient instance to provide.
