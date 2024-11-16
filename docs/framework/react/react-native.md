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
import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

onlineManager.setEventListener((setOnline) => {
  return Network.addNetworkStateListener((state) => {
    setOnline(state.isConnected);
  })
});
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

## Disable re-renders on out of focus Screens

In some situations, including performance concerns, you may want to stop re-renders when a React Native screen gets out of focus. To achieve this we can use `useFocusEffect` from `@react-navigation/native` together with the `notifyOnChangeProps` query option.

This custom hook provides a `notifyOnChangeProps` option that will return an empty array whenever a screen goes out of focus - effectively stopping any re-renders on that scenario. Whenever the screens gets in focus again, the behavior goes back to normal.

```tsx
import React from 'react'
import { NotifyOnChangeProps } from '@tanstack/query-core'
import { useFocusEffect } from '@react-navigation/native'

export function useFocusNotifyOnChangeProps(
  notifyOnChangeProps?: NotifyOnChangeProps,
) {
  const focusedRef = React.useRef(true)

  useFocusEffect(
    React.useCallback(() => {
      focusedRef.current = true

      return () => {
        focusedRef.current = false
      }
    }, []),
  )

  return () => {
    if (!focusedRef.current) {
      return []
    }

    if (typeof notifyOnChangeProps === 'function') {
      return notifyOnChangeProps()
    }

    return notifyOnChangeProps
  }
}
```

In the above code, `useFocusEffect` is used to change the value of a reference that the callback will use as a condition.

The argument is wrapped in a reference to also guarantee that the returned callback always keeps the same reference.

Example usage:

```tsx
function MyComponent() {
  const notifyOnChangeProps = useFocusNotifyOnChangeProps()

  const { dataUpdatedAt } = useQuery({
    queryKey: ['myKey'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.github.com/repos/tannerlinsley/react-query',
      )
      return response.json()
    },
    notifyOnChangeProps,
  })

  return <Text>DataUpdatedAt: {dataUpdatedAt}</Text>
}
```

## Disable queries on out of focus screens

Enabled can also be set to a callback to support disabling queries on out of focus screens without state and re-rendering on navigation, similar to how notifyOnChangeProps works but in addition it wont trigger refetching when invalidating queries with refetchType active.

```tsx
import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

export function useQueryFocusAware(notifyOnChangeProps?: NotifyOnChangeProps) {
  const focusedRef = React.useRef(true)

  useFocusEffect(
    React.useCallback(() => {
      focusedRef.current = true

      return () => {
        focusedRef.current = false
      }
    }, []),
  )

  return () => focusedRef.current
}
```

Example usage:

```tsx
function MyComponent() {
  const isFocused = useQueryFocusAware()

  const { dataUpdatedAt } = useQuery({
    queryKey: ['key'],
    queryFn: () => fetch(...),
    enabled: isFocused,
  })

  return <Text>DataUpdatedAt: {dataUpdatedAt}</Text>
}
```
