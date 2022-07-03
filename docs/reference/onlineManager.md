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
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from 'react-query'

onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(state.isConnected)
  })
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
