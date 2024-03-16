import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import { sleep } from '../utils'
import { FocusManager } from '../focusManager'
import { setIsServer } from './utils'

describe('focusManager', () => {
  let focusManager: FocusManager
  beforeEach(() => {
    vi.resetModules()
    focusManager = new FocusManager()
  })

  it('should call previous remove handler when replacing an event listener', () => {
    const remove1Spy = vi.fn()
    const remove2Spy = vi.fn()

    focusManager.setEventListener(() => remove1Spy)
    focusManager.setEventListener(() => remove2Spy)

    expect(remove1Spy).toHaveBeenCalledTimes(1)
    expect(remove2Spy).not.toHaveBeenCalled()
  })

  it('should use focused boolean arg', async () => {
    let count = 0

    const setup = (setFocused: (focused?: boolean) => void) => {
      setTimeout(() => {
        count++
        setFocused(true)
      }, 20)
      return () => void 0
    }

    focusManager.setEventListener(setup)

    await sleep(30)
    expect(count).toEqual(1)
    expect(focusManager.isFocused()).toBeTruthy()
  })

  it('should return true for isFocused if document is undefined', async () => {
    const { document } = globalThis

    // @ts-expect-error
    delete globalThis.document

    focusManager.setFocused()
    expect(focusManager.isFocused()).toBeTruthy()
    globalThis.document = document
  })

  test('cleanup (removeEventListener) should not be called if window is not defined', async () => {
    const restoreIsServer = setIsServer(true)

    const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener')

    const unsubscribe = focusManager.subscribe(() => undefined)

    unsubscribe()

    expect(removeEventListenerSpy).not.toHaveBeenCalled()

    restoreIsServer()
  })

  test('cleanup (removeEventListener) should not be called if window.addEventListener is not defined', async () => {
    const { addEventListener } = globalThis.window

    // @ts-expect-error
    globalThis.window.addEventListener = undefined

    const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener')

    const unsubscribe = focusManager.subscribe(() => undefined)

    unsubscribe()

    expect(removeEventListenerSpy).not.toHaveBeenCalled()

    globalThis.window.addEventListener = addEventListener
  })

  it('should replace default window listener when a new event listener is set', async () => {
    const unsubscribeSpy = vi.fn().mockImplementation(() => undefined)
    const handlerSpy = vi.fn().mockImplementation(() => unsubscribeSpy)

    focusManager.setEventListener(() => handlerSpy())

    const unsubscribe = focusManager.subscribe(() => undefined)

    // Should call the custom event once
    expect(handlerSpy).toHaveBeenCalledTimes(1)

    unsubscribe()

    // Should unsubscribe our event event
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1)

    handlerSpy.mockRestore()
    unsubscribeSpy.mockRestore()
  })

  test('should call removeEventListener when last listener unsubscribes', () => {
    const addEventListenerSpy = vi.spyOn(globalThis.window, 'addEventListener')

    const removeEventListenerSpy = vi.spyOn(
      globalThis.window,
      'removeEventListener',
    )

    const unsubscribe1 = focusManager.subscribe(() => undefined)
    const unsubscribe2 = focusManager.subscribe(() => undefined)
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1) // visibilitychange event

    unsubscribe1()
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(0)
    unsubscribe2()
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1) // visibilitychange event
  })

  test('should keep setup function even if last listener unsubscribes', () => {
    const setupSpy = vi.fn().mockImplementation(() => () => undefined)

    focusManager.setEventListener(setupSpy)

    const unsubscribe1 = focusManager.subscribe(() => undefined)

    expect(setupSpy).toHaveBeenCalledTimes(1)

    unsubscribe1()

    const unsubscribe2 = focusManager.subscribe(() => undefined)

    expect(setupSpy).toHaveBeenCalledTimes(2)

    unsubscribe2()
  })

  test('should call listeners when setFocused is called', () => {
    const listener = vi.fn()

    focusManager.subscribe(listener)

    focusManager.setFocused(true)
    focusManager.setFocused(true)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenNthCalledWith(1, true)

    focusManager.setFocused(false)
    focusManager.setFocused(false)

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenNthCalledWith(2, false)

    focusManager.setFocused(undefined)
    focusManager.setFocused(undefined)

    expect(listener).toHaveBeenCalledTimes(3)
    expect(listener).toHaveBeenNthCalledWith(3, true)
  })
})
