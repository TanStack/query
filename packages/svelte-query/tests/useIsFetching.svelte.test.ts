import { describe, expect, it, vi } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { QueryClient, createQuery, useIsFetching } from '../src/index.js'
import { withEffectRoot } from './utils.svelte.js'

describe('useIsFetching', () => {
  it('should update as queries start and stop fetching', () => {
    withEffectRoot(async () => {
      const queryClient = new QueryClient()
      const isFetching = useIsFetching()

      let ready = $state(false)

      createQuery(
        () => ({
          queryKey: ['test'],
          queryFn: async () => {
            await sleep(5)
            return 'test'
          },
          enabled: ready,
        }),
        () => queryClient,
      )

      expect(isFetching.current).toBe(0)

      ready = true

      await vi.waitFor(() => {
        expect(isFetching.current).toBe(1)
      })

      await vi.waitFor(() => {
        expect(isFetching.current).toBe(0)
      })
    })
  })
})
