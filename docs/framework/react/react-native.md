---
id: react-native
title: React Native
---

React Query is designed to work out of the box with React Native.

## DevTools Support

There are several options available for React Native DevTools integration:

1. **Native macOS App**: A 3rd party app for debugging React Query in any js-based application:
   https://github.com/LovesWorking/rn-better-dev-tools

2. **Flipper Plugin**: A 3rd party plugin for Flipper users:
   https://github.com/bgaleotti/react-query-native-devtools

3. **Reactotron Plugin**: A 3rd party plugin for Reactotron users:
   https://github.com/hsndmr/reactotron-react-query

## Online status management

React Query already supports auto refetch on reconnect in web browser.
To add this behavior in React Native you have to use React Query `onlineManager` as in the example below:

```tsx
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/react-query'

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})
```

or

```tsx
import { onlineManager } from '@tanstack/react-query'
import * as Network from 'expo-network'

onlineManager.setEventListener((setOnline) => {
  let initialised = false

  const eventSubscription = Network.addNetworkStateListener((state) => {
    initialised = true
    setOnline(!!state.isConnected)
  })

  Network.getNetworkStateAsync()
    .then((state) => {
      if (!initialised) {
        setOnline(!!state.isConnected)
      }
    })
    .catch(() => {
      // getNetworkStateAsync can reject on some platforms/SDK versions
    })

  return eventSubscription.remove
})
```

## Refetch on App focus

Instead of event listeners on `window`, React Native provides focus information through the [`AppState` module](https://reactnative.dev/docs/appstate#app-states). You can use the `AppState` "change" event to trigger an update when the app state changes to "active":

```tsx
import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import type { AppStateStatus } from 'react-native'
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

## Refresh on Screen focus

In some situations, you may want to refetch the query when a React Native Screen is focused again.
This custom hook will refetch **all active stale queries** when the screen is focused again.

```tsx
import React from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useQueryClient } from '@tanstack/react-query'

export function useRefreshOnFocus() {
  const queryClient = useQueryClient()
  const firstTimeRef = React.useRef(true)

  useFocusEffect(
    React.useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false
        return
      }

      // refetch all stale active queries
      queryClient.refetchQueries({
        queryKey: ['posts'],
        stale: true,
        type: 'active',
      })
    }, [queryClient]),
  )
}
```

In the above code, the first focus (when the screen is initially mounted) is skipped because `useFocusEffect` calls our callback on mount in addition to screen focus.

## Disable queries on out of focus screens

If you don’t want certain queries to remain “live” while a screen is out of focus, you can use the subscribed prop on useQuery. This prop lets you control whether a query stays subscribed to updates. Combined with React Navigation’s useIsFocused, it allows you to seamlessly unsubscribe from queries when a screen isn’t in focus:

Example usage:

```tsx
import React from 'react'
import { useIsFocused } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Text } from 'react-native'

function MyComponent() {
  const isFocused = useIsFocused()

  const { dataUpdatedAt } = useQuery({
    queryKey: ['key'],
    queryFn: () => fetch(...),
    subscribed: isFocused,
  })

  return <Text>DataUpdatedAt: {dataUpdatedAt}</Text>
}
```

When subscribed is false, the query unsubscribes from updates and won’t trigger re-renders or fetch new data for that screen. Once it becomes true again (e.g., when the screen regains focus), the query re-subscribes and stays up to date.
