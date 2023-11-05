import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { MutationObserver } from '..'
import { createQueryClient, sleep } from './utils'
import type { QueryClient } from '..'

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

    const subscription1Handler = vi.fn()
    const subscription2Handler = vi.fn()

    const unsubscribe1 = mutation.subscribe(subscription1Handler)
    const unsubscribe2 = mutation.subscribe(subscription2Handler)

    mutation.mutate('input')

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
})
