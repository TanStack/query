import { waitFor } from '@testing-library/react'
import { createQueryClient, sleep } from '../../../../tests/utils'
import { QueryClient, MutationObserver } from '..'

describe('mutationObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  test('onUnsubscribe should not remove the current mutation observer if there is still a subscription', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        await sleep(20)
        return text
      },
    })

    const subscription1Handler = jest.fn()
    const subscription2Handler = jest.fn()

    const unsubscribe1 = mutation.subscribe(subscription1Handler)
    const unsubscribe2 = mutation.subscribe(subscription2Handler)

    mutation.mutate()

    unsubscribe1()

    await waitFor(() => {
      // 1 call: loading
      expect(subscription1Handler).toBeCalledTimes(1)
      // 2 calls: loading, success
      expect(subscription2Handler).toBeCalledTimes(2)
    })

    // Clean-up
    unsubscribe2()
  })

  test('should not notify listeners if options.listeners is set to false', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        await sleep(20)
        return text
      },
    })

    const subscriptionHandler = jest.fn()
    const unsubscribe = mutation.subscribe(subscriptionHandler)
    mutation.mutate()

    await waitFor(() => {
      // 2 calls: loading, success
      expect(subscriptionHandler).toBeCalledTimes(2)
    })
    subscriptionHandler.mockReset()

    // Force a notification with listeners set to false
    // because there is no existing usage of notify with listeners set to false
    mutation['notify']({ listeners: false })

    await waitFor(() => {
      // 0 call because no notification has been sent
      expect(subscriptionHandler).toBeCalledTimes(0)
    })

    unsubscribe()
  })
})
