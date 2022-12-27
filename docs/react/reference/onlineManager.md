---
id: OnlineManager
title: OnlineManager
---

The `OnlineManager` manages the online state within TanStack Query.

It can be used to change the default event listeners or to manually change the online state.

Its available methods are:

- [`setEventListener`](#onlinemanagerseteventlistener)
- [`setOnline`](#onlinemanagersetonline)
- [`isOnline`](#onlinemanagerisonline)

## `onlineManager.setEventListener`

`setEventListener` can be used to set a custom event listener:

```tsx
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/react-query'

onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(!!state.isConnected)
  })
})
```

## `onlineManager.setOnline`

`setOnline` can be used to manually set the online state. Set `undefined` to fallback to the default online check.

```tsx
import { onlineManager } from '@tanstack/react-query'

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

```tsx
const isOnline = onlineManager.isOnline()
```
