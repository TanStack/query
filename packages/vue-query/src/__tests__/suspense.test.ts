import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_streamedQuery } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useQuery } from '../useQuery'
import { useQueryClient } from '../useQueryClient'

vi.mock('../useQueryClient')

describe('suspense()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should release suspense when setQueryData is called while fetch is in-flight', async () => {
    const key = queryKey()

    const query = useQuery({
      queryKey: key,
      queryFn: () => sleep(10000).then(() => 'fetched'),
    })

    const suspensePromise = query.suspense()

    const queryClient = useQueryClient()
    queryClient.setQueryData(key, 'manual data')

    await vi.advanceTimersByTimeAsync(0)

    const result = await suspensePromise
    expect(result.data).toBe('manual data')
  })

  it('should release suspense when streamedQuery receives first chunk', async () => {
    const key = queryKey()

    async function* numberGenerator() {
      await sleep(10)
      yield 'chunk1'
      await sleep(10)
      yield 'chunk2'
    }

    const query = useQuery({
      queryKey: key,
      queryFn: experimental_streamedQuery({
        streamFn: () => numberGenerator(),
      }),
    })

    const suspensePromise = query.suspense()

    await vi.advanceTimersByTimeAsync(10)

    const result = await suspensePromise
    expect(result.data).toStrictEqual(['chunk1'])
  })
})
