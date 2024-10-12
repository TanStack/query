---
id: stable-query-client
title: Stable Query Client
---

The QueryClient contains the QueryCache, so you'd only want to create one instance of the QueryClient for the lifecycle of your application - _not_ a new instance on every render.

> Exception: It's allowed to create a new QueryClient inside an async Server Component, because the async function is only called once on the server.

## Rule Details

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query/stable-query-client": "error" */

function App() {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  )
}
```

Examples of **correct** code for this rule:

```tsx
function App() {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  )
}
```

```tsx
const queryClient = new QueryClient()
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  )
}
```

```tsx
async function App() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(options)
}
```

## Attributes

- [x] ✅ Recommended
- [x] 🔧 Fixable
