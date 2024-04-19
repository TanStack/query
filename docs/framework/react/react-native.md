---
id: react-native
title: React Native
---

React Query is designed to work out of the box with React Native, with the exception of the devtools, which are only supported with React DOM at this time.

There is a 3rd party [Flipper](https://fbflipper.com/docs/getting-started/react-native/) plugin which you can try: https://github.com/bgaleotti/react-query-native-devtools

If you would like to help us make the built-in devtools platform agnostic, please let us know!

## Online status management

React Query already supports auto refetch on reconnect in web browser.
To add this behavior in React Native you have to use React Query `onlineManager` as in the example below:

```ts
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from 'react-query'

onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(state.isInternetReachable)
  })
})
```

## Refetch on App focus

In React Native you have to use React Query `focusManager` to refetch when the App is focused.

```ts
import { focusManager } from 'react-query'

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

```ts
import React from 'react'
import { useFocusEffect } from '@react-navigation/native'

export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
  const firstTimeRef = React.useRef(true)

  useFocusEffect(
    React.useCallback(() => {
      if (firstTimeRef.current) {
         firstTimeRef.current = false;
         return;
      }

      refetch()
    }, [refetch])
  )
}
```

In the above code, `refetch` is skipped the first time because `useFocusEffect` calls our callback on mount in addition to screen focus.
