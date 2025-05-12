import { describe, expect, it, vi } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { QueryClient, createMutation, useIsMutating } from '../src/index.js'
import { withEffectRoot } from './utils.svelte.js'

describe('useIsFetching', () => {
  it('should update as mutations start and stop running', () => {
    withEffectRoot(async () => {
      const queryClient = new QueryClient()
      const isMutating = useIsMutating()

      const { mutate } = createMutation(
        () => ({
          mutationKey: ['mutation-1'],
          mutationFn: async () => {
            await sleep(5)
            return 'data'
          },
        }),
        () => queryClient,
      )

      expect(isMutating.current).toBe(0)

      mutate()

      await vi.waitFor(() => {
        expect(isMutating.current).toBe(1)
      })

      await vi.waitFor(() => {
        expect(isMutating.current).toBe(0)
      })
    })
  })
})
