import { onScopeDispose, reactive, ref } from 'vue-demi'

import { flushPromises, successMutator } from './test-utils'
import { useMutation } from '../useMutation'
import { unrefFilterArgs, useIsMutating } from '../useIsMutating'

jest.mock('../useQueryClient')

describe('useIsMutating', () => {
  test('should properly return isMutating state', async () => {
    const mutation = useMutation({
      mutationFn: (params: string) => successMutator(params),
    })
    const mutation2 = useMutation({
      mutationFn: (params: string) => successMutator(params),
    })
    const isMutating = useIsMutating()

    expect(isMutating.value).toStrictEqual(0)

    mutation.mutateAsync('a')
    mutation2.mutateAsync('b')

    await flushPromises()

    expect(isMutating.value).toStrictEqual(2)

    await flushPromises()

    expect(isMutating.value).toStrictEqual(0)
  })

  test('should stop listening to changes on onScopeDispose', async () => {
    const onScopeDisposeMock = onScopeDispose as jest.MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementation((fn) => fn())

    const mutation = useMutation({
      mutationFn: (params: string) => successMutator(params),
    })
    const mutation2 = useMutation({
      mutationFn: (params: string) => successMutator(params),
    })
    const isMutating = useIsMutating()

    expect(isMutating.value).toStrictEqual(0)

    mutation.mutateAsync('a')
    mutation2.mutateAsync('b')

    await flushPromises()

    expect(isMutating.value).toStrictEqual(0)

    await flushPromises()

    expect(isMutating.value).toStrictEqual(0)

    onScopeDisposeMock.mockReset()
  })

  test('should properly update filters', async () => {
    const filter = reactive({ mutationKey: ['foo'] })
    const { mutate } = useMutation({
      mutationKey: ['isMutating'],
      mutationFn: (params: string) => successMutator(params),
    })
    mutate('foo')

    const isMutating = useIsMutating(filter)

    expect(isMutating.value).toStrictEqual(0)

    filter.mutationKey = ['isMutating']

    await flushPromises()

    expect(isMutating.value).toStrictEqual(1)
  })

  describe('parseMutationFilterArgs', () => {
    test('should merge mutation key with filters', () => {
      const filters = { mutationKey: ['key'], fetching: true }

      const result = unrefFilterArgs(filters)
      const expected = { ...filters, mutationKey: ['key'] }

      expect(result).toEqual(expected)
    })

    test('should unwrap refs arguments', () => {
      const key = ref(['key'])
      const filters = ref({ mutationKey: key, fetching: ref(true) })

      const result = unrefFilterArgs(filters)
      const expected = { mutationKey: ['key'], fetching: true }

      expect(result).toEqual(expected)
    })
  })
})
