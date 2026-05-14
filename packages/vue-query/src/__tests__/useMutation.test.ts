import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useMutation } from '../useMutation'
import { useQueryClient } from '../useQueryClient'

vi.mock('../useQueryClient')

describe('useMutation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be in idle state initially', () => {
    const mutation = useMutation({
      mutationFn: (params) => sleep(0).then(() => params),
    })

    expect(mutation).toMatchObject({
      isIdle: { value: true },
      isPending: { value: false },
      isError: { value: false },
      isSuccess: { value: false },
    })
  })

  it('should change state after invoking mutate', () => {
    const result = 'Mock data'
    const mutation = useMutation({
      mutationFn: (params: string) => sleep(0).then(() => params),
    })

    mutation.mutate(result)

    expect(mutation).toMatchObject({
      isIdle: { value: false },
      isPending: { value: true },
      isError: { value: false },
      isSuccess: { value: false },
      data: { value: undefined },
      error: { value: null },
    })
  })

  it('should return error when request fails', async () => {
    const mutation = useMutation({
      mutationFn: () =>
        sleep(10).then(() => Promise.reject(new Error('Some error'))),
    })
    mutation.mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(mutation).toMatchObject({
      isIdle: { value: false },
      isPending: { value: false },
      isError: { value: true },
      isSuccess: { value: false },
      data: { value: undefined },
      error: { value: Error('Some error') },
    })
  })

  it('should return data when request succeeds', async () => {
    const result = 'Mock data'
    const mutation = useMutation({
      mutationFn: (params: string) => sleep(10).then(() => params),
    })

    mutation.mutate(result)

    await vi.advanceTimersByTimeAsync(10)

    expect(mutation).toMatchObject({
      isIdle: { value: false },
      isPending: { value: false },
      isError: { value: false },
      isSuccess: { value: true },
      data: { value: 'Mock data' },
      error: { value: null },
    })
  })

  it('should work with options getter and be reactive', async () => {
    const key = queryKey()
    const result = 'Mock data'
    const keyRef = ref('key01')
    const fnMock = vi.fn((params: string) => sleep(10).then(() => params))
    const mutation = useMutation(() => ({
      mutationKey: [...key, keyRef.value],
      mutationFn: fnMock,
    }))

    mutation.mutate(result)

    await vi.advanceTimersByTimeAsync(10)

    expect(fnMock).toHaveBeenCalledTimes(1)
    expect(fnMock).toHaveBeenNthCalledWith(
      1,
      result,
      expect.objectContaining({ mutationKey: [...key, 'key01'] }),
    )

    keyRef.value = 'key02'
    await vi.advanceTimersByTimeAsync(0)
    mutation.mutate(result)
    await vi.advanceTimersByTimeAsync(10)

    expect(fnMock).toHaveBeenCalledTimes(2)
    expect(fnMock).toHaveBeenNthCalledWith(
      2,
      result,
      expect.objectContaining({ mutationKey: [...key, 'key02'] }),
    )
  })

  it('should update reactive options', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryClient = useQueryClient()
    const mutationCache = queryClient.getMutationCache()
    const options = reactive({
      mutationKey: key1,
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    const mutation = useMutation(options)

    options.mutationKey = key2
    await vi.advanceTimersByTimeAsync(10)
    mutation.mutate('xyz')

    await vi.advanceTimersByTimeAsync(10)

    const mutations = mutationCache.find({ mutationKey: key2 })

    expect(mutations?.options.mutationKey).toEqual(key2)
  })

  it('should update reactive options deeply', async () => {
    type MutationKeyTest = {
      entity: string
      otherObject: {
        name: string
      }
    }
    const mutationKey = ref<Array<MutationKeyTest>>([
      {
        entity: 'test',
        otherObject: { name: 'objectName' },
      },
    ])
    const queryClient = useQueryClient()
    const mutationCache = queryClient.getMutationCache()
    const options = reactive({
      mutationKey,
      mutationFn: (params: string) => sleep(10).then(() => params),
    })
    const mutation = useMutation(options)

    mutationKey.value[0]!.otherObject.name = 'someOtherObjectName'
    await vi.advanceTimersByTimeAsync(10)
    mutation.mutate('xyz')

    await vi.advanceTimersByTimeAsync(10)

    const mutations = mutationCache.getAll()
    const relevantMutation = mutations.find((m) => {
      return (
        Array.isArray(m.options.mutationKey) &&
        !!m.options.mutationKey[0].otherObject
      )
    })

    expect(
      (relevantMutation?.options.mutationKey as Array<MutationKeyTest>)[0]
        ?.otherObject.name === 'someOtherObjectName',
    ).toBe(true)
  })

  it('should allow for non-options object (mutationFn or mutationKey) passed as arg1 & arg2 to trigger reactive updates', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const mutationKeyRef = ref<Array<string>>(key1)
    const mutationFn = ref((params: string) => sleep(0).then(() => params))
    const queryClient = useQueryClient()
    const mutationCache = queryClient.getMutationCache()
    const mutation = useMutation({ mutationKey: mutationKeyRef, mutationFn })

    mutationKeyRef.value = key2
    let proof = false
    mutationFn.value = (params: string) => {
      proof = true
      return sleep(10).then(() => params)
    }
    await vi.advanceTimersByTimeAsync(10)

    mutation.mutate('xyz')
    await vi.advanceTimersByTimeAsync(10)

    const mutations = mutationCache.find({ mutationKey: key2 })
    expect(mutations?.options.mutationKey).toEqual(key2)
    expect(proof).toEqual(true)
  })

  it('should reset state after invoking mutation.reset', async () => {
    const mutation = useMutation({
      mutationFn: () =>
        sleep(10).then(() => Promise.reject(new Error('Some error'))),
    })

    mutation.mutate()

    await vi.advanceTimersByTimeAsync(10)

    mutation.reset()

    expect(mutation).toMatchObject({
      isIdle: { value: true },
      isPending: { value: false },
      isError: { value: false },
      isSuccess: { value: false },
      data: { value: undefined },
      error: { value: null },
    })
  })

  describe('side effects', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should call onMutate when passed as an option', async () => {
      const onMutate = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => sleep(10).then(() => params),
        onMutate,
      })

      mutation.mutate('')

      await vi.advanceTimersByTimeAsync(10)

      expect(onMutate).toHaveBeenCalledTimes(1)
    })

    it('should call onError when passed as an option', async () => {
      const onError = vi.fn()
      const mutation = useMutation({
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        onError,
      })

      mutation.mutate('')

      await vi.advanceTimersByTimeAsync(10)

      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('should call onSuccess when passed as an option', async () => {
      const onSuccess = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => sleep(10).then(() => params),
        onSuccess,
      })

      mutation.mutate('')

      await vi.advanceTimersByTimeAsync(10)

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should call onSettled when passed as an option', async () => {
      const onSettled = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => sleep(10).then(() => params),
        onSettled,
      })

      mutation.mutate('')

      await vi.advanceTimersByTimeAsync(10)

      expect(onSettled).toHaveBeenCalledTimes(1)
    })

    it('should call onError when passed as an argument of mutate function', async () => {
      const onError = vi.fn()
      const mutation = useMutation({
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
      })

      mutation.mutate(undefined, { onError })

      await vi.advanceTimersByTimeAsync(10)

      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('should call onSuccess when passed as an argument of mutate function', async () => {
      const onSuccess = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => sleep(10).then(() => params),
      })

      mutation.mutate('', { onSuccess })

      await vi.advanceTimersByTimeAsync(10)

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should call onSettled when passed as an argument of mutate function', async () => {
      const onSettled = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => sleep(10).then(() => params),
      })

      mutation.mutate('', { onSettled })

      await vi.advanceTimersByTimeAsync(10)

      expect(onSettled).toHaveBeenCalledTimes(1)
    })

    it('should fire both onSettled functions', async () => {
      const onSettled = vi.fn()
      const onSettledOnFunction = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => sleep(10).then(() => params),
        onSettled,
      })

      mutation.mutate('', { onSettled: onSettledOnFunction })

      await vi.advanceTimersByTimeAsync(10)

      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettledOnFunction).toHaveBeenCalledTimes(1)
    })
  })

  describe('async', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should resolve properly', async () => {
      const result = 'Mock data'
      const mutation = useMutation({
        mutationFn: (params: string) => sleep(10).then(() => params),
      })

      await vi.waitFor(() =>
        expect(mutation.mutateAsync(result)).resolves.toBe(result),
      )

      expect(mutation).toMatchObject({
        isIdle: { value: false },
        isPending: { value: false },
        isError: { value: false },
        isSuccess: { value: true },
        data: { value: 'Mock data' },
        error: { value: null },
      })
    })

    it('should throw on error', async () => {
      const mutation = useMutation({
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
      })

      await vi.waitFor(() =>
        expect(mutation.mutateAsync()).rejects.toThrow('Some error'),
      )

      expect(mutation).toMatchObject({
        isIdle: { value: false },
        isPending: { value: false },
        isError: { value: true },
        isSuccess: { value: false },
        data: { value: undefined },
        error: { value: Error('Some error') },
      })
    })
  })

  it('should warn when used outside of setup function in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      })

      expect(warnSpy).toHaveBeenCalledWith(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    } finally {
      warnSpy.mockRestore()
      vi.unstubAllEnvs()
    }
  })

  describe('throwOnError', () => {
    it('should evaluate throwOnError when mutation is expected to throw', async () => {
      const err = new Error('Expected mock error. All is well!')
      const boundaryFn = vi.fn()
      const { mutate } = useMutation({
        mutationFn: () => sleep(10).then(() => Promise.reject(err)),
        throwOnError: boundaryFn,
      })

      mutate()

      await vi.advanceTimersByTimeAsync(10)

      expect(boundaryFn).toHaveBeenCalledTimes(1)
      expect(boundaryFn).toHaveBeenCalledWith(err)
    })

    it('should throw from error watcher when throwOnError returns true', async () => {
      const throwOnErrorFn = vi.fn().mockReturnValue(true)
      const { mutate } = useMutation({
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        throwOnError: throwOnErrorFn,
      })

      mutate()

      // Suppress the Unhandled Rejection caused by watcher throw in Vue 3
      const rejectionHandler = () => {}
      process.on('unhandledRejection', rejectionHandler)

      await vi.advanceTimersByTimeAsync(10)

      process.off('unhandledRejection', rejectionHandler)

      expect(throwOnErrorFn).toHaveBeenCalledTimes(1)
      expect(throwOnErrorFn).toHaveBeenCalledWith(Error('Some error'))
    })
  })
})
