---
id: mobile-development
title: Mobile Development
---

Preact Query is designed to work out of the box with Preact for mobile development, including hybrid apps and frameworks that use Preact as their rendering layer.

## DevTools Support

There are several options available for Preact Query DevTools integration in mobile environments:

1. **Browser DevTools Extension**: Standard browser extensions work when debugging mobile web apps:
   - [Chrome DevTools](https://chromewebstore.google.com/detail/tanstack-query-devtools/annajfchloimdhceglpgglpeepfghfai)
   - [Firefox DevTools](https://addons.mozilla.org/en-US/firefox/addon/tanstack-query-devtools/)
   - [Edge DevTools](https://microsoftedge.microsoft.com/addons/detail/tanstack-query-devtools/edmdpkgkacmjopodhfolmphdenmddobj)

2. **Native Debugging Apps**: 3rd party apps for debugging JavaScript-based applications:
   - [rn-better-dev-tools](https://github.com/LovesWorking/rn-better-dev-tools) - Native macOS app for debugging queries across devices

3. **Flipper Integration**: For frameworks that support Flipper debugging:
   - Community plugins may be available for integrating TanStack Query with Flipper

## Online status management

Preact Query already supports auto refetch on reconnect in web browsers. To add this behavior in mobile environments, you can use the `onlineManager` as shown in the example below:

```tsx
import { onlineManager } from '@tanstack/preact-query'

// Example for Capacitor/Cordova
import { Network } from '@capacitor/network'

onlineManager.setEventListener((setOnline) => {
  Network.getStatus().then((status) => {
    setOnline(status.connected)
  })

  const listener = Network.addListener('networkStatusChange', (status) => {
    setOnline(status.connected)
  })

  return () => listener.remove()
})

// Example for hybrid apps with custom network detection
onlineManager.setEventListener((setOnline) => {
  const handleOnline = () => setOnline(true)
  const handleOffline = () => setOnline(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
})
```

## Refetch on App focus

In mobile environments, app focus events differ from web browser focus events. You can use framework-specific app state management to trigger updates when the app becomes active:

```tsx
import { useEffect } from 'preact'
import { focusManager } from '@tanstack/preact-query'

// Example for Capacitor
import { App } from '@capacitor/app'

function onAppStateChange(isActive: boolean) {
  focusManager.setFocused(isActive)
}

useEffect(() => {
  const listener = App.addListener('appStateChange', (state) => {
    onAppStateChange(state.isActive)
  })

  return () => listener.remove()
}, [])
```

```tsx
// Example for custom focus management
import { useEffect } from 'preact'
import { focusManager } from '@tanstack/preact-query'

function handleVisibilityChange() {
  focusManager.setFocused(!document.hidden)
}

useEffect(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [])
```

## Refresh on Screen focus

In mobile navigation scenarios, you may want to refetch queries when a specific screen or view becomes focused again. This custom hook will refetch **all active stale queries** when the screen is focused:

```tsx
import { useCallback, useRef } from 'preact'
import { useQueryClient } from '@tanstack/preact-query'

// Custom hook for screen focus refetching
export function useRefreshOnScreenFocus(isScreenFocused: boolean) {
  const queryClient = useQueryClient()
  const firstTimeRef = useRef(true)

  const refetchStaleQueries = useCallback(() => {
    if (firstTimeRef.current) {
      firstTimeRef.current = false
      return
    }

    // Refetch all stale active queries
    queryClient.refetchQueries({
      stale: true,
      type: 'active',
    })
  }, [queryClient])

  // Trigger refetch when screen becomes focused (but not on initial mount)
  useEffect(() => {
    if (isScreenFocused && !firstTimeRef.current) {
      refetchStaleQueries()
    }
  }, [isScreenFocused, refetchStaleQueries])
}
```

Usage example:

```tsx
function MyScreen() {
  const [isFocused, setIsFocused] = useState(false)

  useRefreshOnScreenFocus(isFocused)

  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  // Your screen component logic here...
}
```

## Disable queries on out-of-focus screens

If you don't want certain queries to remain "live" while a screen isn't in focus, you can use the `enabled` option combined with focus state. This allows you to seamlessly control whether queries should be active:

```tsx
import { useState } from 'preact'
import { useQuery } from '@tanstack/preact-query'

function MyComponent({ isScreenFocused }) {
  const { dataUpdatedAt } = useQuery({
    queryKey: ['key'],
    queryFn: () => fetch(...),
    enabled: isScreenFocused, // Only run query when screen is focused
  })

  return <div>DataUpdatedAt: {dataUpdatedAt}</div>
}
```

When `enabled` is false, the query will not fetch data and won't trigger re-renders. Once it becomes true again (e.g., when the screen regains focus), the query will execute and stay up to date.

## Framework-specific considerations

### Capacitor

When using Preact with Capacitor for native mobile apps:

```tsx
import { Capacitor } from '@capacitor/core'
import { onlineManager, focusManager } from '@tanstack/preact-query'

// Network status
if (Capacitor.isNativePlatform()) {
  import { Network } from '@capacitor/network'

  onlineManager.setEventListener((setOnline) => {
    Network.getStatus().then((status) => setOnline(status.connected))

    return Network.addListener('networkStatusChange', (status) => {
      setOnline(status.connected)
    }).remove
  })
}

// App state
import { App } from '@capacitor/app'

App.addListener('appStateChange', ({ isActive }) => {
  focusManager.setFocused(isActive)
})
```

### Cordova

For Cordova-based applications:

```tsx
import { onlineManager, focusManager } from '@tanstack/preact-query'

// Network events
document.addEventListener('online', () => onlineManager.setOnline(true))
document.addEventListener('offline', () => onlineManager.setOnline(false))

// App state events
document.addEventListener('resume', () => focusManager.setFocused(true))
document.addEventListener('pause', () => focusManager.setFocused(false))
```

### Progressive Web Apps (PWA)

For PWA environments:

```tsx
import { onlineManager, focusManager } from '@tanstack/preact-query'

// PWA specific focus handling
if ('serviceWorker' in navigator) {
  window.addEventListener('online', () => onlineManager.setOnline(true))
  window.addEventListener('offline', () => onlineManager.setOnline(false))

  // Handle visibility change for PWA focus
  document.addEventListener('visibilitychange', () => {
    focusManager.setFocused(!document.hidden)
  })
}
```
