---
id: window-focus-refetching
title: Window Focus Refetching
ref: docs/framework/react/guides/window-focus-refetching.md
replace: { '@tanstack/react-query': '@tanstack/svelte-query' }
---

[//]: # 'Example'

```svelte
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // default: true
      },
    },
  })
</script>

<QueryClientProvider client={queryClient}>...</QueryClientProvider>
```

[//]: # 'Example'
[//]: # 'Example2'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  createQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    refetchOnWindowFocus: false,
  }))
</script>
```

[//]: # 'Example2'
[//]: # 'Example3'

```svelte
<script lang="ts">
  import { focusManager } from '@tanstack/svelte-query'
  focusManager.setEventListener((handleFocus) => {
    // Listen to visibilitychange
    if (typeof window !== 'undefined' && window.addEventListener) {
      const visibilitychangeHandler = () => {
        handleFocus(document.visibilityState === 'visible')
      }
      window.addEventListener(
        'visibilitychange',
        visibilitychangeHandler,
        false,
      )
      return () => {
        // Be sure to unsubscribe if a new handler is set
        window.removeEventListener('visibilitychange', visibilitychangeHandler)
      }
    }
  })
</script>
```

[//]: # 'Example3'
[//]: # 'Example4'

```svelte
<script lang="ts">
  import { focusManager } from '@tanstack/svelte-query'

  // Override the default focus state
  focusManager.setFocused(true)

  // Fallback to the default focus check
  focusManager.setFocused(undefined)
</script>
```

[//]: # 'Example4'
[//]: # 'ReactNative'
[//]: # 'ReactNative'
