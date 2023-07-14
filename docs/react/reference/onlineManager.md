---
id: OnlineManager
title: OnlineManager
---

The `OnlineManager` manages the online state within TanStack Query.

It can be used to change the default event listeners or to manually change the online state.

Its available methods are:

- [`setEventListener`](#onlinemanagerseteventlistener)
- [`subscribe`](#onlinemanagersubscribe)
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

## `onlineManager.subscribe`

`subscribe` can be used to subscribe to changes in the online state. It returns an unsubscribe function:

```tsx
import { onlineManager } from '@tanstack/react-query'

const unsubscribe = onlineManager.subscribe(isOnline => {
  console.log('isOnline', isOnline)
})
```

## `onlineManager.setOnline`

`setOnline` can be used to manually set the online state.

```tsx
import { onlineManager } from '@tanstack/react-query'

// Set to online
onlineManager.setOnline(true)

// Set to offline
onlineManager.setOnline(false)
```

**Options**

- `online: boolean`

## `onlineManager.isOnline`

`isOnline` can be used to get the current online state.

```tsx
const isOnline = onlineManager.isOnline()
```
