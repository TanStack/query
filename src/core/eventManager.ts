import { isServer } from './utils'

type ListenerFn = () => void

export function createEventManager(
  events: ReadonlyArray<Parameters<typeof window['addEventListener']>[0]>
) {
  let value: boolean | undefined
  let removeEventListener: ListenerFn | undefined
  let listeners: ListenerFn[] = []
  let setupFn: (
    param: (newValue?: boolean) => void
  ) => ListenerFn | undefined = onEvent => {
    if (!isServer && window?.addEventListener) {
      const listener = () => onEvent()
      events.forEach(eventName => {
        window.addEventListener(eventName, listener, false)
      })

      return () => {
        events.forEach(eventName => {
          window.removeEventListener(eventName, listener)
        })
      }
    }
  }

  const subscribe = (listener: ListenerFn): ListenerFn => {
    listeners.push(listener)

    if (!removeEventListener) {
      setEventListener(setupFn)
    }

    return () => {
      listeners = listeners.filter(x => x !== listener)
      if (listeners.length === 0) {
        removeEventListener?.()
        removeEventListener = undefined
      }
    }
  }

  const setValue = (newValue?: boolean): void => {
    value = newValue

    if (newValue) {
      onEvent()
    }
  }

  const setEventListener = (
    setup: (param: (newValue?: boolean) => void) => ListenerFn | undefined
  ): void => {
    removeEventListener?.()
    setupFn = setup
    removeEventListener = setupFn(newValue => {
      if (typeof newValue === 'boolean') {
        setValue(newValue)
      } else {
        onEvent()
      }
    })
  }

  const onEvent = (): void => {
    listeners.forEach(listener => {
      listener()
    })
  }

  return {
    setEventListener,
    subscribe,
    setValue,
    getValue: () => value,
  } as const
}
