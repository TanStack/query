import { createEventManager } from './eventManager'

export const createFocusManager = () => {
  const { setEventListener, subscribe, ...manager } = createEventManager([
    'visibilitychange',
    'focus',
  ])

  return {
    subscribe,
    setEventListener,
    setFocused: manager.setValue,
    isFocused: (): boolean => {
      const value = manager.getValue()
      if (typeof value === 'boolean') {
        return value
      }

      // document global can be unavailable in react native
      if (typeof document === 'undefined') {
        return true
      }

      return [undefined, 'visible', 'prerender'].includes(
        document.visibilityState
      )
    },
  }
}

export const focusManager = createFocusManager()
