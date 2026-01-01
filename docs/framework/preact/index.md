---
id: index
title: Preact Query
---

# Preact Query

Preact Query (formally TanStack Query for Preact) is the powerful, declarative data-fetching and state management library for Preact applications. It provides a complete set of hooks and utilities for managing server state with ease.

## Features

- 🚀 **Fast & Lightweight**: Optimized for Preact's minimal footprint
- 🔄 **Automatic Refetching**: Refetch on window focus, reconnect, or intervals
- 🗄 **Caching**: Intelligent caching with background updates
- 🎯 **Query Deduplication**: Prevents duplicate requests
- 🚦 **Optimistic Updates**: Instant UI feedback for mutations
- 📱 **Mobile Ready**: Works perfectly with Capacitor, Cordova, and PWA
- 🔧 **TypeScript First**: Full TypeScript support with excellent inference
- 🌊 **Suspense Support**: Preact/Comoat Suspense-compatible async patterns (though it is generally not recommended to use preact/compat)
- 🛠️ **DevTools**: Powerful debugging and development tools

## Quick Start

```tsx
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/preact-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  )
}

function Todos() {
  const { isPending, error, data } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then((res) => res.json()),
  })

  if (isPending) return 'Loading...'
  if (error) return 'Error: ' + error.message

  return (
    <ul>
      {data?.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

## Core Concepts

- **[Queries](./guides/queries.md)**: Fetch and cache data from servers
- **[Mutations](./guides/mutations.md)**: Create, update, or delete server data
- **[Query Invalidation](./guides/query-invalidation.md)**: Keep data fresh and synchronized

## Installation

```bash
npm install @tanstack/preact-query
```

Learn more in our [Installation Guide](./installation.md).

## Essential Guides

- [Installation](./installation.md) - Setup and configuration
- [Quick Start](./quick-start.md) - Get running in minutes
- [Queries](./guides/queries.md) - Fetching and caching data
- [Mutations](./guides/mutations.md) - Updating server data
- [Query Invalidation](./guides/query-invalidation.md) - Keeping data fresh
- [TypeScript](./typescript.md) - Type safety and inference
- [Mobile Development](./mobile-development.md) - Mobile app patterns

## Persistence & Storage

- [persistQueryClient](./plugins/persistQueryClient.md) - Cache persistence
- [createAsyncStoragePersister](./plugins/createAsyncStoragePersister.md) - Async storage
- [createSyncStoragePersister](./plugins/createSyncStoragePersister.md) - Sync storage

## Development Tools

- [DevTools](./devtools.md) - Debugging and inspection
- [TypeScript Guide](./typescript.md) - Type-safe development

## Reference

- [API Reference](./reference/) - Complete API documentation
- [Comparison](./comparison.md) - How Preact Query compares

## Additional Resources

- [Examples](../../examples/preact/) - Real-world examples
- [Migration Guide](./guides/migrating-to-v5.md) - Version migration
- [GraphQL Integration](./graphql.md) - Using with GraphQL

Preact Query gives you:

- ✅ Better developer experience
- ✅ Improved user experience
- ✅ Less code to maintain
- ✅ Automatic performance optimizations
- ✅ Predictable state management

Start building better Preact applications today! 🎉
