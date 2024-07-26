import { beforeEach, describe, expect, test, vi } from 'vitest'
import { OnlineManager } from '../onlineManager'
import { setIsServer, sleep } from './utils'

describe('onlineManager', () => {
  let onlineManager: OnlineManager
  beforeEach(() => {
    onlineManager = new OnlineManager()
  })

  test('isOnline should return true if navigator is undefined', () => {
    const navigatorSpy = vi.spyOn(globalThis, 'navigator', 'get')

    // Force navigator to be undefined
    // @ts-expect-error
    navigatorSpy.mockImplementation(() => undefined)
    expect(onlineManager.isOnline()).toBeTruthy()

    navigatorSpy.mockRestore()
  })

  test('isOnline should return true if navigator.onLine is true', () => {
    const navigatorSpy = vi.spyOn(navigator, 'onLine', 'get')
    navigatorSpy.mockImplementation(() => true)

    expect(onlineManager.isOnline()).toBeTruthy()

    navigatorSpy.mockRestore()
  })

  test('setEventListener should use online boolean arg', async () => {
    let count = 0

    const setup = (setOnline: (online: boolean) => void) => {
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
    const remove1Spy = vi.fn()
    const remove2Spy = vi.fn()

    onlineManager.setEventListener(() => remove1Spy)
    onlineManager.setEventListener(() => remove2Spy)

    expect(remove1Spy).toHaveBeenCalledTimes(1)
    expect(remove2Spy).not.toHaveBeenCalled()
  })

  test('cleanup (removeEventListener) should not be called if window is not defined', async () => {
    const restoreIsServer = setIsServer(true)

    const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener')

    const unsubscribe = onlineManager.subscribe(() => undefined)

    unsubscribe()

    expect(removeEventListenerSpy).not.toHaveBeenCalled()

    restoreIsServer()
  })

  test('cleanup (removeEventListener) should not be called if window.addEventListener is not defined', async () => {
    const { addEventListener } = globalThis.window

    // @ts-expect-error
    globalThis.window.addEventListener = undefined

    const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener')

    const unsubscribe = onlineManager.subscribe(() => undefined)

    unsubscribe()

    expect(removeEventListenerSpy).not.toHaveBeenCalled()

    globalThis.window.addEventListener = addEventListener
  })

  test('it should replace default window listener when a new event listener is set', async () => {
    const addEventListenerSpy = vi.spyOn(globalThis.window, 'addEventListener')

    const removeEventListenerSpy = vi.spyOn(
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
    const addEventListenerSpy = vi.spyOn(globalThis.window, 'addEventListener')

    const removeEventListenerSpy = vi.spyOn(
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
    const setupSpy = vi.fn().mockImplementation(() => () => undefined)

    onlineManager.setEventListener(setupSpy)

    const unsubscribe1 = onlineManager.subscribe(() => undefined)

    expect(setupSpy).toHaveBeenCalledTimes(1)

    unsubscribe1()

    const unsubscribe2 = onlineManager.subscribe(() => undefined)

    expect(setupSpy).toHaveBeenCalledTimes(2)

    unsubscribe2()
  })

  test('should call listeners when setOnline is called', () => {
    const listener = vi.fn()

    onlineManager.subscribe(listener)

    onlineManager.setOnline(false)
    onlineManager.setOnline(false)

    expect(listener).toHaveBeenNthCalledWith(1, false)

    onlineManager.setOnline(true)
    onlineManager.setOnline(true)

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenNthCalledWith(2, true)
  })
})
