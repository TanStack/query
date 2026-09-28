import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onScopeDispose, reactive, ref } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useMutation } from '../useMutation'
import { useIsMutating } from '../useMutationState'
import { useQueryClient } from '../useQueryClient'
import { QueryClient } from '../queryClient'

vi.mock('../useQueryClient')

describe('useIsMutating', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should properly return isMutating state', async () => {
    const mutation = useMutation({
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    const mutation2 = useMutation({
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    const isMutating = useIsMutating()

    expect(isMutating.value).toStrictEqual(0)

    mutation.mutateAsync('a')
    mutation2.mutateAsync('b')
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutating.value).toStrictEqual(2)
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutating.value).toStrictEqual(0)
  })

  it('should stop listening to changes on onScopeDispose', async () => {
    const onScopeDisposeMock = vi.mocked(onScopeDispose)
    onScopeDisposeMock.mockImplementation((fn) => fn())

    const key = queryKey()
    const queryClient = useQueryClient()
    const mutation = useMutation({
      mutationKey: key,
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    const mutation2 = useMutation({
      mutationKey: key,
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    const isMutating = useIsMutating()

    expect(isMutating.value).toStrictEqual(0)

    mutation.mutateAsync('a')
    mutation2.mutateAsync('b')
    await vi.advanceTimersByTimeAsync(0)
    expect(queryClient.isMutating({ mutationKey: key })).toBe(2)
    expect(isMutating.value).toStrictEqual(0)
    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.isMutating({ mutationKey: key })).toBe(0)
    expect(isMutating.value).toStrictEqual(0)

    onScopeDisposeMock.mockReset()
  })

  it('should properly update filters', async () => {
    const key = queryKey()
    const filterKey = queryKey()
    const filter = reactive({ mutationKey: filterKey })
    const { mutate } = useMutation({
      mutationKey: key,
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    mutate('foo')

    const isMutating = useIsMutating(filter)

    expect(isMutating.value).toStrictEqual(0)

    filter.mutationKey = key
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutating.value).toStrictEqual(1)
  })

  it('should work with options getter and be reactive', async () => {
    const key = queryKey()
    const keyRef = ref('isMutatingGetter2')
    const { mutate } = useMutation({
      mutationKey: key,
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    mutate('foo')

    const isMutating = useIsMutating(() => ({
      mutationKey: [keyRef.value],
    }))

    expect(isMutating.value).toStrictEqual(0)

    keyRef.value = key[0]!
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutating.value).toStrictEqual(1)
  })

  it('should accept filters wrapped in a ref', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const mutation1 = useMutation({
      mutationKey: key1,
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    const mutation2 = useMutation({
      mutationKey: key2,
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    const isMutating = useIsMutating(ref({ mutationKey: key1 }))

    mutation1.mutate('a')
    mutation2.mutate('b')
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutating.value).toStrictEqual(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutating.value).toStrictEqual(0)
  })

  it('should use the queryClient passed as the second argument', async () => {
    const queryClient = new QueryClient()
    const mutation = useMutation(
      {
        mutationFn: (params: string) => sleep(10).then(() => params),
      },
      queryClient,
    )
    const isMutating = useIsMutating({}, queryClient)

    expect(isMutating.value).toStrictEqual(0)

    mutation.mutate('a')
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutating.value).toStrictEqual(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutating.value).toStrictEqual(0)
  })
})
