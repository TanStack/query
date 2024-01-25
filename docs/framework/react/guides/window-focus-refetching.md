---
id: window-focus-refetching
title: Window Focus Refetching
---

If a user leaves your application and returns and the query data is stale, **TanStack Query automatically requests fresh data for you in the background**. You can disable this globally or per-query using the `refetchOnWindowFocus` option:

#### Disabling Globally

[//]: # 'Example'

```tsx
//
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
    },
  },
})

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```

[//]: # 'Example'

#### Disabling Per-Query

[//]: # 'Example2'

```tsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchOnWindowFocus: false,
})
```

[//]: # 'Example2'

## Custom Window Focus Event

In rare circumstances, you may want to manage your own window focus events that trigger TanStack Query to revalidate. To do this, TanStack Query provides a `focusManager.setEventListener` function that supplies you the callback that should be fired when the window is focused and allows you to set up your own events. When calling `focusManager.setEventListener`, the previously set handler is removed (which in most cases will be the default handler) and your new handler is used instead. For example, this is the default handler:

[//]: # 'Example3'

```tsx
focusManager.setEventListener((handleFocus) => {
  // Listen to visibilitychange and focus
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('visibilitychange', handleFocus, false)
    window.addEventListener('focus', handleFocus, false)
  }

  return () => {
    // Be sure to unsubscribe if a new handler is set
    window.removeEventListener('visibilitychange', handleFocus)
    window.removeEventListener('focus', handleFocus)
  }
})
```

[//]: # 'Example3'

## Ignoring Iframe Focus Events

A great use-case for replacing the focus handler is that of iframe events. Iframes present problems with detecting window focus by both double-firing events and also firing false-positive events when focusing or using iframes within your app. If you experience this, you should use an event handler that ignores these events as much as possible. I recommend [this one](https://gist.github.com/tannerlinsley/1d3a2122332107fcd8c9cc379be10d88)! It can be set up in the following way:

[//]: # 'Example4'

```tsx
import { focusManager } from '@tanstack/react-query'
import onWindowFocus from './onWindowFocus' // The gist above

focusManager.setEventListener(onWindowFocus) // Boom!
```

[//]: # 'Example4'
[//]: # 'ReactNative'

## Managing Focus in React Native

Instead of event listeners on `window`, React Native provides focus information through the [`AppState` module](https://reactnative.dev/docs/appstate#app-states). You can use the `AppState` "change" event to trigger an update when the app state changes to "active":

```tsx
import { AppState } from 'react-native'
import { focusManager } from '@tanstack/react-query'

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

useEffect(() => {
  const subscription = AppState.addEventListener('change', onAppStateChange)

  return () => subscription.remove()
}, [])
```

[//]: # 'ReactNative'

## Managing focus state

[//]: # 'Example5'

```tsx
import { focusManager } from '@tanstack/react-query'

// Override the default focus state
focusManager.setFocused(true)

// Fallback to the default focus check
focusManager.setFocused(undefined)
```

[//]: # 'Example5'

## Pitfalls & Caveats

Some browser internal dialogue windows, such as spawned by `alert()` or file upload dialogues (as created by `<input type="file" />`) might also trigger focus refetching after they close. This can result in unwanted side effects, as the refetching might trigger component unmounts or remounts before your file upload handler is executed. See [this issue on GitHub](https://github.com/tannerlinsley/react-query/issues/2960) for background and possible workarounds.
