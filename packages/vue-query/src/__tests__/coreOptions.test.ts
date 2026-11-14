import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue-demi'
import {
  infiniteQueryOptions as coreInfiniteQueryOptions,
  mutationOptions as coreMutationOptions,
  queryOptions as coreQueryOptions,
} from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { useMutation } from '../useMutation'
import { useQuery } from '../useQuery'

vi.mock(import('../useQueryClient'))

describe('core options', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should fetch with a getter of core options', async () => {
    const options = coreQueryOptions({
      queryKey: createKey(),
      queryFn: () => sleep(0).then(() => 'data'),
    })

    const { data } = useQuery(() => options)
    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toBe('data')
  })

  it('should pass the query to a core enabled callback', async () => {
    const key = createKey()
    const enabled = vi.fn<
      (query: { queryKey: ReadonlyArray<unknown> }) => boolean
    >((query) => Array.isArray(query.queryKey))
    const options = coreQueryOptions({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'data'),
      enabled,
    })

    useQuery(() => options)
    await vi.advanceTimersByTimeAsync(0)

    expect(enabled.mock.calls[0]?.[0].queryKey).toStrictEqual(key)
  })

  it('should react to core options selected in a getter', async () => {
    const id = ref(1)
    const todoOptions = (todoId: number) =>
      coreQueryOptions({
        queryKey: ['todo', todoId],
        queryFn: () => sleep(0).then(() => todoId),
      })

    const { data } = useQuery(() => todoOptions(id.value))
    await vi.advanceTimersByTimeAsync(0)
    expect(data.value).toBe(1)

    id.value = 2
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toBe(2)
  })

  it('should let an override in the getter replace a core enabled callback', async () => {
    const enabled = ref(false)
    const queryFn = vi.fn<() => Promise<string>>(() =>
      sleep(0).then(() => 'data'),
    )
    const options = coreQueryOptions({
      queryKey: createKey(),
      queryFn,
      enabled: () => true,
    })

    useQuery(() => ({ ...options, enabled: enabled.value }))
    await vi.advanceTimersByTimeAsync(0)
    expect(queryFn).not.toHaveBeenCalled()

    enabled.value = true
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should fetch with a getter of core infinite options', async () => {
    const options = coreInfiniteQueryOptions({
      queryKey: createKey(),
      queryFn: ({ pageParam }) => sleep(0).then(() => pageParam),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage + 1,
    })

    const { data, fetchNextPage } = useInfiniteQuery(() => options)
    await vi.advanceTimersByTimeAsync(0)
    expect(data.value?.pages).toStrictEqual([0])

    void fetchNextPage()
    await vi.advanceTimersByTimeAsync(0)

    expect(data.value?.pages).toStrictEqual([0, 1])
  })

  it('should run core mutation options', async () => {
    const onSuccess = vi.fn<(data: number, variables: number) => void>()
    const options = coreMutationOptions({
      mutationFn: (value: number) => sleep(0).then(() => value + 1),
      onSuccess,
    })

    const { mutate, data } = useMutation(options)
    mutate(1)
    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toBe(2)
    expect(onSuccess.mock.calls[0]?.slice(0, 2)).toStrictEqual([2, 1])
  })
})
