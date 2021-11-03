import { onlineManager } from '../onlineManager'
import { sleep } from '../utils'

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
})
