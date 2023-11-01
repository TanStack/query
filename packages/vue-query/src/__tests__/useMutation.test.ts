import { beforeEach, describe, expect, test, vi } from 'vitest'
import { reactive, ref } from 'vue-demi'
import { useMutation } from '../useMutation'
import { useQueryClient } from '../useQueryClient'
import { errorMutator, flushPromises, successMutator } from './test-utils'

vi.mock('../useQueryClient')

describe('useMutation', () => {
  test('should be in idle state initially', () => {
    const mutation = useMutation({
      mutationFn: (params) => successMutator(params),
    })

    expect(mutation).toMatchObject({
      isIdle: { value: true },
      isPending: { value: false },
      isError: { value: false },
      isSuccess: { value: false },
    })
  })

  test('should change state after invoking mutate', () => {
    const result = 'Mock data'
    const mutation = useMutation({
      mutationFn: (params: string) => successMutator(params),
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

  test('should return error when request fails', async () => {
    const mutation = useMutation({ mutationFn: errorMutator })
    mutation.mutate({})
    await flushPromises(10)
    expect(mutation).toMatchObject({
      isIdle: { value: false },
      isPending: { value: false },
      isError: { value: true },
      isSuccess: { value: false },
      data: { value: undefined },
      error: { value: Error('Some error') },
    })
  })

  test('should return data when request succeeds', async () => {
    const result = 'Mock data'
    const mutation = useMutation({
      mutationFn: (params: string) => successMutator(params),
    })

    mutation.mutate(result)

    await flushPromises(10)

    expect(mutation).toMatchObject({
      isIdle: { value: false },
      isPending: { value: false },
      isError: { value: false },
      isSuccess: { value: true },
      data: { value: 'Mock data' },
      error: { value: null },
    })
  })

  test('should update reactive options', async () => {
    const queryClient = useQueryClient()
    const mutationCache = queryClient.getMutationCache()
    const options = reactive({
      mutationKey: ['foo'],
      mutationFn: (params: string) => successMutator(params),
    })
    const mutation = useMutation(options)

    options.mutationKey = ['bar']
    await flushPromises()
    mutation.mutate('xyz')

    await flushPromises()

    const mutations = mutationCache.find({ mutationKey: ['bar'] })

    expect(mutations?.options.mutationKey).toEqual(['bar'])
  })

  test('should update reactive options deeply', async () => {
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
      mutationFn: (params: string) => successMutator(params),
    })
    const mutation = useMutation(options)

    mutationKey.value[0]!.otherObject.name = 'someOtherObjectName'
    await flushPromises()
    mutation.mutate('xyz')

    await flushPromises()

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
    )
  })

  test('should allow for non-options object (mutationFn or mutationKey) passed as arg1 & arg2 to trigger reactive updates', async () => {
    const mutationKey = ref<Array<string>>(['foo2'])
    const mutationFn = ref((params: string) => successMutator(params))
    const queryClient = useQueryClient()
    const mutationCache = queryClient.getMutationCache()
    const mutation = useMutation({ mutationKey, mutationFn })

    mutationKey.value = ['bar2']
    let proof = false
    mutationFn.value = (params: string) => {
      proof = true
      return successMutator(params)
    }
    await flushPromises()

    mutation.mutate('xyz')
    await flushPromises()

    const mutations = mutationCache.find({ mutationKey: ['bar2'] })
    expect(mutations?.options.mutationKey).toEqual(['bar2'])
    expect(proof).toEqual(true)
  })

  test('should reset state after invoking mutation.reset', async () => {
    const mutation = useMutation({
      mutationFn: (params: string) => errorMutator(params),
    })

    mutation.mutate('')

    await flushPromises(10)

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

    test('should call onMutate when passed as an option', async () => {
      const onMutate = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => successMutator(params),
        onMutate,
      })

      mutation.mutate('')

      await flushPromises(10)

      expect(onMutate).toHaveBeenCalledTimes(1)
    })

    test('should call onError when passed as an option', async () => {
      const onError = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => errorMutator(params),
        onError,
      })

      mutation.mutate('')

      await flushPromises(10)

      expect(onError).toHaveBeenCalledTimes(1)
    })

    test('should call onSuccess when passed as an option', async () => {
      const onSuccess = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => successMutator(params),
        onSuccess,
      })

      mutation.mutate('')

      await flushPromises(10)

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('should call onSettled when passed as an option', async () => {
      const onSettled = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => successMutator(params),
        onSettled,
      })

      mutation.mutate('')

      await flushPromises(10)

      expect(onSettled).toHaveBeenCalledTimes(1)
    })

    test('should call onError when passed as an argument of mutate function', async () => {
      const onError = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => errorMutator(params),
      })

      mutation.mutate('', { onError })

      await flushPromises(10)

      expect(onError).toHaveBeenCalledTimes(1)
    })

    test('should call onSuccess when passed as an argument of mutate function', async () => {
      const onSuccess = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => successMutator(params),
      })

      mutation.mutate('', { onSuccess })

      await flushPromises(10)

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('should call onSettled when passed as an argument of mutate function', async () => {
      const onSettled = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => successMutator(params),
      })

      mutation.mutate('', { onSettled })

      await flushPromises(10)

      expect(onSettled).toHaveBeenCalledTimes(1)
    })

    test('should fire both onSettled functions', async () => {
      const onSettled = vi.fn()
      const onSettledOnFunction = vi.fn()
      const mutation = useMutation({
        mutationFn: (params: string) => successMutator(params),
        onSettled,
      })

      mutation.mutate('', { onSettled: onSettledOnFunction })

      await flushPromises(10)

      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettledOnFunction).toHaveBeenCalledTimes(1)
    })
  })

  describe('async', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    test('should resolve properly', async () => {
      const result = 'Mock data'
      const mutation = useMutation({
        mutationFn: (params: string) => successMutator(params),
      })

      await expect(mutation.mutateAsync(result)).resolves.toBe(result)

      expect(mutation).toMatchObject({
        isIdle: { value: false },
        isPending: { value: false },
        isError: { value: false },
        isSuccess: { value: true },
        data: { value: 'Mock data' },
        error: { value: null },
      })
    })

    test('should throw on error', async () => {
      const mutation = useMutation({ mutationFn: errorMutator })

      await expect(mutation.mutateAsync({})).rejects.toThrowError('Some error')

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

  describe('throwOnError', () => {
    test('should evaluate throwOnError when mutation is expected to throw', async () => {
      const err = new Error('Expected mock error. All is well!')
      const boundaryFn = vi.fn()
      const { mutate } = useMutation({
        mutationFn: () => {
          return Promise.reject(err)
        },
        throwOnError: boundaryFn,
      })

      mutate()

      await flushPromises()

      expect(boundaryFn).toHaveBeenCalledTimes(1)
      expect(boundaryFn).toHaveBeenCalledWith(err)
    })
  })
})
