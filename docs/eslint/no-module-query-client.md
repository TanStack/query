---
id: no-module-query-client
title: Disallow module-level QueryClient in Next.js
---

When doing server-side rendering with Next.js, it's critical to create the QueryClient instance inside your component (using React state or a ref), not at the module level. Creating the QueryClient at the file root makes the cache shared between all requests and users, which is bad for performance and can leak sensitive data.

> This rule only applies to Next.js projects (files in `pages/` or `app/` directories, or files named `_app` or `_document`).

## Rule Details

Examples of **incorrect** code for this rule:

```tsx
// pages/_app.tsx
/* eslint "@tanstack/query/no-module-query-client": "error" */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// NEVER DO THIS:
// Creating the queryClient at the file root level makes the cache shared
// between all requests and means _all_ data gets passed to _all_ users.
// Besides being bad for performance, this also leaks any sensitive data.
const queryClient = new QueryClient()

export default function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
```

```tsx
// pages/_app.tsx
/* eslint "@tanstack/query/no-module-query-client": "error" */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function MyApp({ Component, pageProps }) {
  // This is also incorrect - creating a new instance on every render
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
```

Examples of **correct** code for this rule:

```tsx
// pages/_app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function MyApp({ Component, pageProps }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
```

```tsx
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

```tsx
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRef } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClientRef = useRef(new QueryClient())

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  )
}
```

## When Not To Use It

This rule is specifically designed for Next.js applications. If you're not using Next.js or server-side rendering, this rule may not be necessary. The rule only runs on files that appear to be in a Next.js project structure (`pages/`, `app/`, `_app`, `_document`).

## Attributes

- [x] ✅ Recommended
- [ ] 🔧 Fixable
