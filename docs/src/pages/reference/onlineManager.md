---
id: OnlineManager
title: OnlineManager
---

The `OnlineManager` manages the online state within React Query.

It can be used to change the default event listeners or to manually change the online state.

Its available methods are:

- [`setEventListener`](#onlinemanagerseteventlistener)
- [`setOnline`](#onlinemanagersetonline)
- [`isOnline`](#onlinemanagerisonline)

## `onlineManager.setEventListener`

`setEventListener` can be used to set a custom event listener:

```js
import { onlineManager } from 'react-query'

onlineManager.setEventListener(handleOnline => {
  // Listen to visibillitychange and online
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('visibilitychange', handleOnline, false)
    window.addEventListener('online', handleOnline, false)
  }

  return () => {
    // Be sure to unsubscribe if a new handler is set
    window.removeEventListener('visibilitychange', handleOnline)
    window.removeEventListener('online', handleOnline)
  }
})
```

## `onlineManager.setOnline`

`setOnline` can be used to manually set the online state. Set `undefined` to fallback to the default online check.

```js
import { onlineManager } from 'react-query'

// Set to online
onlineManager.setOnline(true)

// Set to offline
onlineManager.setOnline(false)

// Fallback to the default online check
onlineManager.setOnline(undefined)
```

**Options**

- `online: boolean | undefined`

## `onlineManager.isOnline`

`isOnline` can be used to get the current online state.

```js
const isOnline = onlineManager.isOnline()
```
