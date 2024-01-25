---
id: useQueryClient
title: useQueryClient
---

The `useQueryClient` hook returns the current `QueryClient` instance.

```tsx
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient({ context })
```

**Options**

- `context?: React.Context<QueryClient | undefined>`
  - Use this to use a custom React Query context. Otherwise, `defaultContext` will be used.
