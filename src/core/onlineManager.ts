import { createEventManager } from './eventManager'

export const createOnlineManager = () => {
  const { setEventListener, subscribe, ...manager } = createEventManager([
    'online',
    'offline',
  ])

  return {
    subscribe,
    setEventListener,
    setOnline: manager.setValue,
    isOnline: (): boolean => {
      const value = manager.getValue()
      if (typeof value === 'boolean') {
        return value
      }

      if (
        typeof navigator === 'undefined' ||
        typeof navigator.onLine === 'undefined'
      ) {
        return true
      }

      return navigator.onLine
    },
  }
}

export const onlineManager = createOnlineManager()
