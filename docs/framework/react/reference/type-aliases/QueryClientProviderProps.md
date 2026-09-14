---
id: QueryClientProviderProps
title: QueryClientProviderProps
---

```ts
type QueryClientProviderProps = object;
```

Defined in: [packages/react-query/src/QueryClientProvider.tsx:38](https://github.com/TanStack/query/blob/main/packages/react-query/src/QueryClientProvider.tsx#L38)

The props accepted by `QueryClientProvider`.

## Properties

### children?

```ts
optional children: React.ReactNode;
```

Defined in: [packages/react-query/src/QueryClientProvider.tsx:48](https://github.com/TanStack/query/blob/main/packages/react-query/src/QueryClientProvider.tsx#L48)

The components that get access to the provided `QueryClient`.

***

### client

```ts
client: QueryClient;
```

Defined in: [packages/react-query/src/QueryClientProvider.tsx:44](https://github.com/TanStack/query/blob/main/packages/react-query/src/QueryClientProvider.tsx#L44)

**Required**

The `QueryClient` instance to provide.
