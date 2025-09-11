import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { onScopeDispose, reactive } from 'vue-demi'
import { sleep } from '@tanstack/query-test-utils'
import { useMutation } from '../useMutation'
import { useIsMutating, useMutationState } from '../useMutationState'
import { useQueryClient } from '../useQueryClient'
import type { MockedFunction } from 'vitest'

vi.mock('../useQueryClient')

describe('useIsMutating', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should properly return isMutating state', async () => {
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

  test('should stop listening to changes on onScopeDispose', async () => {
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

  test('should properly update filters', async () => {
    const filter = reactive({ mutationKey: ['foo'] })
    const { mutate } = useMutation({
      mutationKey: ['isMutating'],
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    mutate('foo')

    const isMutating = useIsMutating(filter)

    expect(isMutating.value).toStrictEqual(0)

    filter.mutationKey = ['isMutating']

    await vi.advanceTimersByTimeAsync(0)

    expect(isMutating.value).toStrictEqual(1)
  })
})

describe('useMutationState', () => {
  it('should return variables after calling mutate 1', () => {
    const mutationKey = ['mutation']
    const variables = 'foo123'

    const { mutate } = useMutation({
      mutationKey: mutationKey,
      mutationFn: (params: string) => sleep(0).then(() => params),
    })

    mutate(variables)

    const mutationState = useMutationState({
      filters: { mutationKey, status: 'pending' },
      select: (mutation) => mutation.state.variables,
    })

    expect(mutationState.value).toEqual([variables])
  })

  it('should return variables after calling mutate 2', () => {
    const queryClient = useQueryClient()
    queryClient.clear()
    const mutationKey = ['mutation']
    const variables = 'bar234'

    const { mutate } = useMutation({
      mutationKey: mutationKey,
      mutationFn: (params: string) => sleep(0).then(() => params),
    })

    mutate(variables)

    const mutationState = useMutationState()

    expect(mutationState.value[0]?.variables).toEqual(variables)
  })
})
