import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onScopeDispose, reactive, ref } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useMutation } from '../useMutation'
import { useIsMutating } from '../useMutationState'
import type { MockedFunction } from 'vitest'

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
    const onScopeDisposeMock = onScopeDispose as MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementation((fn) => fn())

    const mutation = useMutation({
      mutationFn: (params: string) => sleep(0).then(() => params),
    })
    const mutation2 = useMutation({
      mutationFn: (params: string) => sleep(0).then(() => params),
    })
    const isMutating = useIsMutating()

    expect(isMutating.value).toStrictEqual(0)

    mutation.mutateAsync('a')
    mutation2.mutateAsync('b')

    await vi.advanceTimersByTimeAsync(0)

    expect(isMutating.value).toStrictEqual(0)

    await vi.advanceTimersByTimeAsync(0)

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
})
