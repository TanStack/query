---
id: window-focus-refetching
title: Window Focus Refetching
---

If a user leaves your application and returns to stale data, you may want to trigger an update in the background to update any stale queries. Thankfully, **React Query does this automatically for you**, but if you choose to disable it, you can use the `refetchOnWindowFocus` option to disable it:

```js
const queryCache = new QueryCache({
  defaultConfig: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      ...
    </ReactQueryCacheProvider>
  )
}
```

## Custom Window Focus Event

In rare circumstances, you may want to manage your own window focus events that trigger React Query to revalidate. To do this, React Query provides a `setFocusHandler` function that supplies you the callback that should be fired when the window is focused and allows you to set up your own events. When calling `setFocusHandler`, the previously set handler is removed (which in most cases will be the default handler) and your new handler is used instead. For example, this is the default handler:

```js
setFocusHandler(handleFocus => {
  // Listen to visibillitychange and focus
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

## Ignoring Iframe Focus Events

A great use-case for replacing the focus handler is that of iframe events. Iframes present problems with detecting window focus by both double-firing events and also firing false-positive events when focusing or using iframes within your app. If you experience this, you should use an event handler that ignores these events as much as possible. I recommend [this one](https://gist.github.com/tannerlinsley/1d3a2122332107fcd8c9cc379be10d88)! It can be set up in the following way:

```js
import { setFocusHandler } from 'react-query'
import onWindowFocus from './onWindowFocus' // The gist above

setFocusHandler(onWindowFocus) // Boom!
```

## Managing Focus in React Native

Instead of event listeners on `window`, React Native provides focus information through the [`AppState` module](https://reactnative.dev/docs/appstate#app-states). You can use the `AppState` "change" event to trigger an update when the app state changes to "active":

```js
import { setFocusHandler } from 'react-query'
import { AppState } from 'react-native'

setFocusHandler(handleFocus => {
  const handleAppStateChange = appState => {
    if (appState === 'active') {
      handleFocus()
    }
  }
  AppState.addEventListener('change', handleAppStateChange)
  return () => AppState.removeEventListener('change', handleAppStateChange)
})
```
