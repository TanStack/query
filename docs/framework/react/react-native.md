---
id: react-native
title: React Native
---

React Query is designed to work out of the box with React Native, with the exception of the devtools, which are only supported with React DOM at this time.

There is a 3rd party [Expo](https://docs.expo.dev/) plugin which you can try: https://github.com/expo/dev-plugins/tree/main/packages/react-query

There is a 3rd party [Flipper](https://fbflipper.com/docs/getting-started/react-native/) plugin which you can try: https://github.com/bgaleotti/react-query-native-devtools

There is a 3rd party [Reactotron](https://github.com/infinitered/reactotron/) plugin which you can try: https://github.com/hsndmr/reactotron-react-query

If you would like to help us make the built-in devtools platform agnostic, please let us know!

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
  const eventSubscription = Network.addNetworkStateListener((state) => {
    setOnline(!!state.isConnected)
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
This custom hook will call the provided `refetch` function when the screen is focused again.

```tsx
import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
  const firstTimeRef = React.useRef(true)

  useFocusEffect(
    React.useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false
        return
      }

      refetch()
    }, [refetch]),
  )
}
```

In the above code, `refetch` is skipped the first time because `useFocusEffect` calls our callback on mount in addition to screen focus.

## Disable queries on out of focus screens

### `subscribed` option

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

### `PauseManagerProvider` option

In case you want to disable updates to _all_ queries in an out of focus screen, one alternative is to control them via `PauseManager`:

```tsx
import React from 'react'
import { useIsFocused } from '@react-navigation/native'
import { PauseManager, PauseManagerProvider } from 'react-native'

function MyScreen() {
  const isFocused = useIsFocused()
  const pauseManager = useRef<PauseManager>(null)
  if (pauseManager.current === null) {
    pauseManager.current = new PauseManager(!isFocused)
  }
  useEffect(() => {
    pauseManager.current?.setPaused(!isFocused)
  }, [isFocused])

  return (
    <PauseManagerProvider pauseManager={pauseManager}>
      <MyComponent />
    </PauseManagerProvider>
  )
}
```
