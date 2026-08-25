---
id: QueryClientProviderProps
title: QueryClientProviderProps
---

```ts
type QueryClientProviderProps = object;
```

Defined in: [preact-query/src/QueryClientProvider.tsx:37](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryClientProvider.tsx#L37)

The props accepted by `QueryClientProvider`.

## Properties

### children?

```ts
optional children: ComponentChildren;
```

Defined in: [preact-query/src/QueryClientProvider.tsx:47](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryClientProvider.tsx#L47)

The components that get access to the provided QueryClient.

***

### client

```ts
client: QueryClient;
```

Defined in: [preact-query/src/QueryClientProvider.tsx:43](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryClientProvider.tsx#L43)

**Required**

The QueryClient instance to provide.
