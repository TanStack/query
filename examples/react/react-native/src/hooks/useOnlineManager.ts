import * as React from 'react'
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/react-query'
import { Platform } from 'react-native'

export function useOnlineManager() {
  React.useEffect(() => {
    // React Query already supports on reconnect auto refetch in web browser
    if (Platform.OS !== 'web') {
      onlineManager.setEventListener((setOnline) =>
        NetInfo.addEventListener((state) => {
          setOnline(!!state.isConnected)
        }),
      )
    }
  }, [])
}
