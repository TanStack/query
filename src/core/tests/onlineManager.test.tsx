import { onlineManager } from '../onlineManager'

describe('onlineManager', () => {
  test('isOnline should return true if navigator is undefined', () => {
    const navigatorSpy = jest.spyOn(globalThis, 'navigator', 'get')

    // Force navigator to be undefined
    //@ts-ignore
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
})
