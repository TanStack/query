import { OnlineManager } from '../onlineManager'
import { setIsServer, sleep } from './utils'

describe('onlineManager', () => {
  let onlineManager: OnlineManager
  beforeEach(() => {
    onlineManager = new OnlineManager()
  })

  test('isOnline should return true if navigator is undefined', () => {
    const navigatorSpy = jest.spyOn(globalThis, 'navigator', 'get')

    // Force navigator to be undefined
    //@ts-expect-error
    navigatorSpy.mockImplementation(() => undefined)
    expect(onlineManager.isOnline()).toBeTruthy()

    navigatorSpy.mockRestore()
  })

  test('isOnline should return true if navigator.onLine is true', () => {
    const navigatorSpy = jest.spyOn(navigator, 'onLine', 'get')
    navigatorSpy.mockImplementation(() => true)

    expect(onlineManager.isOnline()).toBeTruthy()

    navigatorSpy.mockRestore()
  })

  test('setEventListener should use online boolean arg', async () => {
    let count = 0

    const setup = (setOnline: (online?: boolean) => void) => {
      setTimeout(() => {
        count++
        setOnline(false)
      }, 20)
      return () => void 0
    }

    onlineManager.setEventListener(setup)

    await sleep(30)
    expect(count).toEqual(1)
    expect(onlineManager.isOnline()).toBeFalsy()
  })

  test('setEventListener should call previous remove handler when replacing an event listener', () => {
    const remove1Spy = jest.fn()
    const remove2Spy = jest.fn()

    onlineManager.setEventListener(() => remove1Spy)
    onlineManager.setEventListener(() => remove2Spy)

    expect(remove1Spy).toHaveBeenCalledTimes(1)
    expect(remove2Spy).not.toHaveBeenCalled()
  })

  test('cleanup should still be undefined if window is not defined', async () => {
    const restoreIsServer = setIsServer(true)

    const unsubscribe = onlineManager.subscribe(() => undefined)
    expect(onlineManager['cleanup']).toBeUndefined()

    unsubscribe()
    restoreIsServer()
  })

  test('cleanup should still be undefined if window.addEventListener is not defined', async () => {
    const { addEventListener } = globalThis.window

    // @ts-expect-error
    globalThis.window.addEventListener = undefined

    const unsubscribe = onlineManager.subscribe(() => undefined)
    expect(onlineManager['cleanup']).toBeUndefined()

    unsubscribe()
    globalThis.window.addEventListener = addEventListener
  })

  test('it should replace default window listener when a new event listener is set', async () => {
    const addEventListenerSpy = jest.spyOn(
      globalThis.window,
      'addEventListener',
    )

    const removeEventListenerSpy = jest.spyOn(
      globalThis.window,
      'removeEventListener',
    )

    // Should set the default event listener with window event listeners
    const unsubscribe = onlineManager.subscribe(() => undefined)
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2)

    // Should replace the window default event listener by a new one
    // and it should call window.removeEventListener twice
    onlineManager.setEventListener(() => {
      return () => void 0
    })

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(2)

    unsubscribe()
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  test('should call removeEventListener when last listener unsubscribes', () => {
    const addEventListenerSpy = jest.spyOn(
      globalThis.window,
      'addEventListener',
    )

    const removeEventListenerSpy = jest.spyOn(
      globalThis.window,
      'removeEventListener',
    )

    const unsubscribe1 = onlineManager.subscribe(() => undefined)
    const unsubscribe2 = onlineManager.subscribe(() => undefined)
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2) // online + offline

    unsubscribe1()
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(0)
    unsubscribe2()
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(2) // online + offline
  })

  test('should keep setup function even if last listener unsubscribes', () => {
    const setupSpy = jest.fn().mockImplementation(() => () => undefined)

    onlineManager.setEventListener(setupSpy)

    const unsubscribe1 = onlineManager.subscribe(() => undefined)

    expect(setupSpy).toHaveBeenCalledTimes(1)

    unsubscribe1()

    const unsubscribe2 = onlineManager.subscribe(() => undefined)

    expect(setupSpy).toHaveBeenCalledTimes(2)

    unsubscribe2()
  })
})
