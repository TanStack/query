import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isReactive, ref } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useMutation } from '../useMutation'
import { useIsMutating, useMutationState } from '../useMutationState'
import { useQueryClient } from '../useQueryClient'
import { mutationOptions } from '../mutationOptions'

vi.mock('../useQueryClient')

describe('mutationOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    useQueryClient().clear()
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

  it('should return the getter received as a parameter without any modification (with mutationKey in mutationOptions)', () => {
    const getter = () =>
      ({
        mutationKey: ['key'],
        mutationFn: () => sleep(10).then(() => 5),
      }) as const

    expect(mutationOptions(getter)).toBe(getter)
  })

  it('should return the getter received as a parameter without any modification (without mutationKey in mutationOptions)', () => {
    const getter = () =>
      ({
        mutationFn: () => sleep(10).then(() => 5),
      }) as const

    expect(mutationOptions(getter)).toBe(getter)
  })

  it('should work when used with useMutation (getter without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions(() => ({
      mutationFn: () => sleep(10).then(() => 'data'),
    }))

    const { mutate, data } = useMutation(mutationOpts)

    mutate()
    await vi.advanceTimersByTimeAsync(10)

    expect(data.value).toEqual('data')
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
    await vi.advanceTimersByTimeAsync(50)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray).toEqual([0, 1, 0])
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
    await vi.advanceTimersByTimeAsync(50)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray).toEqual([0, 1, 0])
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
    await vi.advanceTimersByTimeAsync(50)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray).toEqual([0, 2, 0])
  })

  it('should return the number of fetching mutations when used with useIsMutating (filter mutationOpts1.mutationKey)', async () => {
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
    const isMutating = useIsMutating({
      mutationKey: mutationOpts1.mutationKey,
    })

    isMutatingArray.push(isMutating.value)

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(isMutating.value)
    await vi.advanceTimersByTimeAsync(50)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray).toEqual([0, 1, 0])
  })

  it('should return the number of fetching mutations when used with useIsMutating (getter with mutationKey in mutationOptions)', async () => {
    const keyRef = ref('isMutatingGetter')
    const mutationOpts = mutationOptions(() => ({
      mutationKey: [keyRef.value],
      mutationFn: () => sleep(10).then(() => 'data'),
    }))

    const { mutate } = useMutation(mutationOpts)
    mutate()

    const isMutating = useIsMutating({
      mutationKey: [keyRef.value],
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(isMutating.value).toEqual(1)

    await vi.advanceTimersByTimeAsync(10)
    expect(isMutating.value).toEqual(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating (getter without mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const mutationOpts = mutationOptions(() => ({
      mutationFn: () => sleep(50).then(() => 'data'),
    }))

    const { mutate } = useMutation(mutationOpts)
    const isMutating = useIsMutating()

    isMutatingArray.push(isMutating.value)

    mutate()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(isMutating.value)
    await vi.advanceTimersByTimeAsync(50)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray).toEqual([0, 1, 0])
  })

  it('should return the number of fetching mutations when used with useIsMutating (getter)', async () => {
    const isMutatingArray: Array<number> = []
    const mutationOpts1 = mutationOptions(() => ({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data1'),
    }))
    const mutationOpts2 = mutationOptions(() => ({
      mutationFn: () => sleep(50).then(() => 'data2'),
    }))

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const isMutating = useIsMutating()

    isMutatingArray.push(isMutating.value)

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(isMutating.value)
    await vi.advanceTimersByTimeAsync(50)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray).toEqual([0, 2, 0])
  })

  it('should return the number of fetching mutations when used with useIsMutating (getter, filter mutationOpts1.mutationKey)', async () => {
    const isMutatingArray: Array<number> = []
    const mutationOpts1 = mutationOptions(() => ({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data1'),
    }))
    const mutationOpts2 = mutationOptions(() => ({
      mutationFn: () => sleep(50).then(() => 'data2'),
    }))

    const resolvedOpts1 = mutationOpts1()

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const isMutating = useIsMutating({
      mutationKey: resolvedOpts1.mutationKey,
    })

    isMutatingArray.push(isMutating.value)

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    isMutatingArray.push(isMutating.value)
    await vi.advanceTimersByTimeAsync(50)
    isMutatingArray.push(isMutating.value)

    expect(isMutatingArray).toEqual([0, 1, 0])
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (with mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationOpts = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(queryClient.isMutating(mutationOpts))
    })

    isMutatingArray.push(queryClient.isMutating(mutationOpts))

    mutate()
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (without mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(queryClient.isMutating())
    })

    isMutatingArray.push(queryClient.isMutating())

    mutate()
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
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

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(queryClient.isMutating())
    })

    isMutatingArray.push(queryClient.isMutating())

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(2)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (filter mutationOpts1.mutationKey)', async () => {
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

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(
        queryClient.isMutating({
          mutationKey: mutationOpts1.mutationKey,
        }),
      )
    })

    isMutatingArray.push(
      queryClient.isMutating({
        mutationKey: mutationOpts1.mutationKey,
      }),
    )

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (getter with mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationOpts = mutationOptions(() => ({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data'),
    }))

    const { mutate } = useMutation(mutationOpts)

    const resolvedOpts = mutationOpts()

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(queryClient.isMutating(resolvedOpts))
    })

    isMutatingArray.push(queryClient.isMutating(resolvedOpts))

    mutate()
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (getter without mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationOpts = mutationOptions(() => ({
      mutationFn: () => sleep(500).then(() => 'data'),
    }))

    const { mutate } = useMutation(mutationOpts)

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(queryClient.isMutating())
    })

    isMutatingArray.push(queryClient.isMutating())

    mutate()
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (getter)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationOpts1 = mutationOptions(() => ({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data1'),
    }))
    const mutationOpts2 = mutationOptions(() => ({
      mutationFn: () => sleep(500).then(() => 'data2'),
    }))

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(queryClient.isMutating())
    })

    isMutatingArray.push(queryClient.isMutating())

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(2)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (getter, filter mutationOpts1.mutationKey)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = useQueryClient()
    const mutationOpts1 = mutationOptions(() => ({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data1'),
    }))
    const mutationOpts2 = mutationOptions(() => ({
      mutationFn: () => sleep(500).then(() => 'data2'),
    }))

    const resolvedOpts1 = mutationOpts1()

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(
        queryClient.isMutating({
          mutationKey: resolvedOpts1.mutationKey,
        }),
      )
    })

    isMutatingArray.push(
      queryClient.isMutating({
        mutationKey: resolvedOpts1.mutationKey,
      }),
    )

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return mutation states when used with useMutationState (with mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)
    const states = useMutationState({
      filters: { mutationKey: mutationOpts.mutationKey, status: 'success' },
      select: (mutation) => mutation.state.data,
    })

    expect(states.value).toEqual([])

    mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(states.value).toEqual(['data'])
  })

  it('should return mutation states when used with useMutationState (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    const { mutate } = useMutation(mutationOpts)
    const states = useMutationState({
      filters: { status: 'success' },
      select: (mutation) => mutation.state.data,
    })

    expect(states.value).toEqual([])

    mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(states.value).toEqual(['data'])
  })

  it('should return mutation states when used with useMutationState', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const states = useMutationState({
      filters: { status: 'success' },
      select: (mutation) => mutation.state.data,
    })

    expect(states.value).toEqual([])

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(10)
    expect(states.value).toEqual(['data1', 'data2'])
  })

  it('should return mutation states when used with useMutationState (filter mutationOpts1.mutationKey)', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const states = useMutationState({
      filters: { mutationKey: mutationOpts1.mutationKey, status: 'success' },
      select: (mutation) => mutation.state.data,
    })

    expect(states.value).toEqual([])

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(10)
    expect(states.value).toEqual(['data1'])
  })

  it('should return mutation states when used with useMutationState (getter with mutationKey in mutationOptions)', async () => {
    const keyRef = ref('useMutationStateGetter')
    const mutationOpts = mutationOptions(() => ({
      mutationKey: [keyRef.value],
      mutationFn: (params: string) => sleep(10).then(() => params),
    }))

    const { mutate } = useMutation(mutationOpts)
    mutate('foo')

    const states = useMutationState({
      filters: { mutationKey: [keyRef.value], status: 'pending' },
      select: (mutation) => mutation.state.variables,
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(states.value).toEqual(['foo'])
  })

  it('should return mutation states when used with useMutationState (getter without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions(() => ({
      mutationFn: () => sleep(10).then(() => 'data'),
    }))

    const { mutate } = useMutation(mutationOpts)
    const states = useMutationState({
      filters: { status: 'success' },
      select: (mutation) => mutation.state.data,
    })

    expect(states.value).toEqual([])

    mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(states.value).toEqual(['data'])
  })

  it('should return mutation states when used with useMutationState (getter)', async () => {
    const mutationOpts1 = mutationOptions(() => ({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data1'),
    }))
    const mutationOpts2 = mutationOptions(() => ({
      mutationFn: () => sleep(10).then(() => 'data2'),
    }))

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const states = useMutationState({
      filters: { status: 'success' },
      select: (mutation) => mutation.state.data,
    })

    expect(states.value).toEqual([])

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(10)
    expect(states.value).toEqual(['data1', 'data2'])
  })

  it('should return mutation states when used with useMutationState (getter, filter mutationOpts1.mutationKey)', async () => {
    const mutationOpts1 = mutationOptions(() => ({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data1'),
    }))
    const mutationOpts2 = mutationOptions(() => ({
      mutationFn: () => sleep(10).then(() => 'data2'),
    }))

    const resolvedOpts1 = mutationOpts1()

    const { mutate: mutate1 } = useMutation(mutationOpts1)
    const { mutate: mutate2 } = useMutation(mutationOpts2)
    const states = useMutationState({
      filters: { mutationKey: resolvedOpts1.mutationKey, status: 'success' },
      select: (mutation) => mutation.state.data,
    })

    expect(states.value).toEqual([])

    mutate1()
    mutate2()
    await vi.advanceTimersByTimeAsync(10)
    expect(states.value).toEqual(['data1'])
  })

  it('should return data in a shallow ref when shallow is true', async () => {
    const mutationOpts = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(10).then(() => ({ nested: { count: 0 } })),
      shallow: true,
    })

    const { mutate, data } = useMutation(mutationOpts)

    mutate()
    await vi.advanceTimersByTimeAsync(10)

    expect(data.value).toEqual({ nested: { count: 0 } })
    expect(isReactive(data.value?.nested)).toBe(false)
  })

  it('should return data in a shallow ref when shallow is true (getter)', async () => {
    const mutationOpts = mutationOptions(() => ({
      mutationKey: ['key'],
      mutationFn: () => sleep(10).then(() => ({ nested: { count: 0 } })),
      shallow: true,
    }))

    const { mutate, data } = useMutation(mutationOpts)

    mutate()
    await vi.advanceTimersByTimeAsync(10)

    expect(data.value).toEqual({ nested: { count: 0 } })
    expect(isReactive(data.value?.nested)).toBe(false)
  })

  it('should reactively update mutationKey when ref changes in getter', async () => {
    const key = queryKey()
    const keyRef = ref('key01')
    const fnMock = vi.fn((params: string) => sleep(10).then(() => params))
    const mutationOpts = mutationOptions(() => ({
      mutationKey: [...key, keyRef.value],
      mutationFn: fnMock,
    }))

    const mutation = useMutation(mutationOpts)

    mutation.mutate('data')
    await vi.advanceTimersByTimeAsync(10)

    expect(fnMock).toHaveBeenCalledTimes(1)
    expect(fnMock).toHaveBeenNthCalledWith(
      1,
      'data',
      expect.objectContaining({ mutationKey: [...key, 'key01'] }),
    )

    keyRef.value = 'key02'
    await vi.advanceTimersByTimeAsync(0)
    mutation.mutate('data')
    await vi.advanceTimersByTimeAsync(10)

    expect(fnMock).toHaveBeenCalledTimes(2)
    expect(fnMock).toHaveBeenNthCalledWith(
      2,
      'data',
      expect.objectContaining({ mutationKey: [...key, 'key02'] }),
    )
  })
})
