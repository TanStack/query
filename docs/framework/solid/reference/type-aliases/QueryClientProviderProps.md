---
id: QueryClientProviderProps
title: QueryClientProviderProps
---

```ts
type QueryClientProviderProps = object;
```

Defined in: [packages/solid-query/src/QueryClientProvider.tsx:63](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClientProvider.tsx#L63)

The props accepted by `QueryClientProvider`.

## Properties

### children?

```ts
optional children: JSX.Element;
```

Defined in: [packages/solid-query/src/QueryClientProvider.tsx:73](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClientProvider.tsx#L73)

The components that get access to the provided `QueryClient`.

***

### client

```ts
client: QueryClient;
```

Defined in: [packages/solid-query/src/QueryClientProvider.tsx:69](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClientProvider.tsx#L69)

**Required**

The `QueryClient` instance to provide.
