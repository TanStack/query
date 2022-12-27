---
id: custom-logger
title: Custom Logger
---

If you want to change how information is logged by TanStack Query, you can set a custom logger when creating a `QueryClient`.

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

**Deprecated**

Custom loggers have been deprecated and will be removed in the next major version.
Logging only has an effect in development mode, where passing a custom logger is not necessary.
