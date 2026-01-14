import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onScopeDispose } from 'vue-demi'
import { sleep } from '@tanstack/query-test-utils'
import { mutationOptions } from '../mutationOptions'
import { useMutation } from '../useMutation'
import { useIsMutating, useMutationState } from '../useMutationState'
import { useQueryClient } from '../useQueryClient'
import type { MockedFunction } from 'vitest'
import type { MutationState } from '@tanstack/query-core'

vi.mock('../useQueryClient')

describe('mutationOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the object received as a parameter without any modification (with mutationKey in mutationOptions)', () => {
    const object = {
      mutationKey: ['key'],
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toStrictEqual(object)
  })

  it('should return the object received as a parameter without any modification (without mutationKey in mutationOptions)', () => {
    const object = {
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toStrictEqual(object)
  })

  it('should return the number of fetching mutations when used with useIsMutating (with mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const mutationOpts = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)
    const isMutating = useIsMutating()

    isMutatingArray.push(isMutating.value)

    mutate()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(isMutating.value)

    await vi.advanceTimersByTimeAsync(51)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray[0]).toEqual(0)
    expect(isMutatingArray[1]).toEqual(1)
    expect(isMutatingArray[2]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating (without mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)
    const isMutating = useIsMutating()

    isMutatingArray.push(isMutating.value)

    mutate()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(isMutating.value)

    await vi.advanceTimersByTimeAsync(51)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray[0]).toEqual(0)
    expect(isMutatingArray[1]).toEqual(1)
    expect(isMutatingArray[2]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating', async () => {
    const isMutatingArray: Array<number> = []
    const mutationOpts1 = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const isMutating = useIsMutating()

    isMutatingArray.push(isMutating.value)

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(isMutating.value)

    await vi.advanceTimersByTimeAsync(51)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray[0]).toEqual(0)
    expect(isMutatingArray[1]).toEqual(2)
    expect(isMutatingArray[2]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating (filter mutationOpts1.mutationKey)', async () => {
    const isMutatingArray: Array<number> = []
    const mutationKey1 = ['key'] as const
    const mutationOpts1 = mutationOptions({
      mutationKey: mutationKey1,
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const isMutating = useIsMutating({
      mutationKey: mutationKey1,
    })

    isMutatingArray.push(isMutating.value)

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(isMutating.value)

    await vi.advanceTimersByTimeAsync(51)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray[0]).toEqual(0)
    expect(isMutatingArray[1]).toEqual(1)
    expect(isMutatingArray[2]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (with mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationKey = ['mutation'] as const
    const mutationOpts = mutationOptions({
      mutationKey,
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)
    isMutatingArray.push(queryClient.isMutating({ mutationKey }))

    mutate()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(queryClient.isMutating({ mutationKey }))

    await vi.advanceTimersByTimeAsync(501)
    isMutatingArray.push(queryClient.isMutating({ mutationKey }))

    expect(isMutatingArray[0]).toEqual(0)
    expect(isMutatingArray[1]).toEqual(1)
    expect(isMutatingArray[2]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (without mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)
    isMutatingArray.push(queryClient.isMutating())

    mutate()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(queryClient.isMutating())

    await vi.advanceTimersByTimeAsync(501)
    isMutatingArray.push(queryClient.isMutating())

    expect(isMutatingArray[0]).toEqual(0)
    expect(isMutatingArray[1]).toEqual(1)
    expect(isMutatingArray[2]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    isMutatingArray.push(queryClient.isMutating())

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(queryClient.isMutating())

    await vi.advanceTimersByTimeAsync(501)
    isMutatingArray.push(queryClient.isMutating())

    expect(isMutatingArray[0]).toEqual(0)
    expect(isMutatingArray[1]).toEqual(2)
    expect(isMutatingArray[2]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (filter mutationOpt1.mutationKey)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationKey1 = ['mutation'] as const
    const mutationOpts1 = mutationOptions({
      mutationKey: mutationKey1,
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    isMutatingArray.push(queryClient.isMutating({
      mutationKey: mutationKey1,
    }))

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(queryClient.isMutating({
      mutationKey: mutationKey1,
    }))

    await vi.advanceTimersByTimeAsync(501)
    isMutatingArray.push(queryClient.isMutating({
      mutationKey: mutationKey1,
    }))

    expect(isMutatingArray[0]).toEqual(0)
    expect(isMutatingArray[1]).toEqual(1)
    expect(isMutatingArray[2]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with useMutationState (with mutationKey in mutationOptions)', async () => {
    const queryClient = useQueryClient()
    queryClient.clear()
    const mutationStateArray: Array<
      MutationState<unknown, Error, unknown, unknown>
    > = []
    const mutationKey = ['mutation'] as const
    const mutationOpts = mutationOptions({
      mutationKey,
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)
    const mutationState = useMutationState({
      filters: { mutationKey, status: 'success' },
    })

    expect(mutationState.value.length).toEqual(0)

    mutate()
    await vi.advanceTimersByTimeAsync(11)

    mutationStateArray.push(...mutationState.value)
    expect(mutationStateArray.length).toEqual(1)
    expect(mutationStateArray[0]?.data).toEqual('data')
  })

  it('should return the number of fetching mutations when used with useMutationState (without mutationKey in mutationOptions)', async () => {
    const queryClient = useQueryClient()
    queryClient.clear()
    const mutationStateArray: Array<
      MutationState<unknown, Error, unknown, unknown>
    > = []
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)
    const mutationState = useMutationState({
      filters: { status: 'success' },
    })

    expect(mutationState.value.length).toEqual(0)

    mutate()
    await vi.advanceTimersByTimeAsync(11)

    mutationStateArray.push(...mutationState.value)
    expect(mutationStateArray.length).toEqual(1)
    expect(mutationStateArray[0]?.data).toEqual('data')
  })

  it('should return the number of fetching mutations when used with useMutationState', async () => {
    const queryClient = useQueryClient()
    queryClient.clear()
    const mutationStateArray: Array<
      MutationState<unknown, Error, unknown, unknown>
    > = []
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const mutationState = useMutationState({
      filters: { status: 'success' },
    })

    expect(mutationState.value.length).toEqual(0)

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(11)

    mutationStateArray.push(...mutationState.value)
    expect(mutationStateArray.length).toEqual(2)
    expect(mutationStateArray[0]?.data).toEqual('data1')
    expect(mutationStateArray[1]?.data).toEqual('data2')
  })

  it('should return the number of fetching mutations when used with useMutationState (filter mutationOpt1.mutationKey)', async () => {
    const queryClient = useQueryClient()
    queryClient.clear()
    const mutationStateArray: Array<
      MutationState<unknown, Error, unknown, unknown>
    > = []
    const mutationKey1 = ['mutation'] as const
    const mutationOpts1 = mutationOptions({
      mutationKey: mutationKey1,
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const mutationState = useMutationState({
      filters: { mutationKey: mutationKey1, status: 'success' },
    })

    expect(mutationState.value.length).toEqual(0)

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(11)

    mutationStateArray.push(...mutationState.value)
    expect(mutationStateArray.length).toEqual(1)
    expect(mutationStateArray[0]?.data).toEqual('data1')
    expect(mutationStateArray[1]).toBeFalsy()
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
})
