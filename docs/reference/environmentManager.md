---
id: EnvironmentManager
title: environmentManager
---

The `environmentManager` manages how TanStack Query detects whether the current runtime should be treated as server-side.

By default, it uses the same server detection as the exported `isServer` utility from query-core.

Use this manager to override server detection globally for runtimes that are not traditional browser/server environments (for example, extension workers).

Its available methods are:

- [`isServer`](#environmentmanagerisserver)
- [`setIsServer`](#environmentmanagersetisserver)

## `environmentManager.isServer`

Returns whether the current runtime is treated as a server environment.

```tsx
import { environmentManager } from '@tanstack/react-query'

const server = environmentManager.isServer()
```

## `environmentManager.setIsServer`

Overrides the server check globally.

```tsx
import { environmentManager } from '@tanstack/react-query'

// Static override
environmentManager.setIsServer(false)

// Dynamic override
environmentManager.setIsServer(() => {
  return typeof window === 'undefined' && !('chrome' in globalThis)
})
```

**Options**

- `isServerValue: boolean | (() => boolean)`

To restore the default behavior, set the function back to query-core's `isServer` utility:

```tsx
import { environmentManager, isServer } from '@tanstack/react-query'

environmentManager.setIsServer(() => isServer)
```
