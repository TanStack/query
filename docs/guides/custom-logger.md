---
id: custom-logger
title: Custom Logger
---

If you want to change how information is logged by React Query, you can set a custom logger when creating a `QueryClient`.

```tsx
const queryClient = new QueryClient({
  logger: {
    log: (...args) => {
      // Log debugging information
    },
    warn: (...args) => {
      // Log warning
    },
    error: (...args) => {
      // Log error
    },
  },
})
```
