import { onScopeDispose, reactive, ref } from 'vue-demi'

import { useMutation } from '../useMutation'
import { parseFilterArgs, useIsMutating } from '../useIsMutating'
import { useQueryClient } from '../useQueryClient'
import { flushPromises, successMutator } from './test-utils'

jest.mock('../useQueryClient')

describe('useIsMutating', () => {
  test('should properly return isMutating state', async () => {
    const mutation = useMutation((params: string) => successMutator(params))
    const mutation2 = useMutation((params: string) => successMutator(params))
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

    const mutation = useMutation((params: string) => successMutator(params))
    const mutation2 = useMutation((params: string) => successMutator(params))
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

  test('should call `useQueryClient` with a proper `queryClientKey`', async () => {
    const queryClientKey = 'foo'
    useIsMutating({ queryClientKey })

    expect(useQueryClient).toHaveBeenCalledWith(queryClientKey)
  })

  test('should properly update filters', async () => {
    const filter = reactive({ mutationKey: ['foo'] })
    const { mutate } = useMutation(['isMutating'], (params: string) =>
      successMutator(params),
    )
    mutate('foo')

    const isMutating = useIsMutating(filter)

    expect(isMutating.value).toStrictEqual(0)

    filter.mutationKey = ['isMutating']

    await flushPromises()

    expect(isMutating.value).toStrictEqual(1)
  })

  describe('parseMutationFilterArgs', () => {
    test('should default to empty filters', () => {
      const result = parseFilterArgs(undefined)

      expect(result).toEqual({})
    })

    test('should merge mutation key with filters', () => {
      const filters = { fetching: true }

      const result = parseFilterArgs(['key'], filters)
      const expected = { ...filters, mutationKey: ['key'] }

      expect(result).toEqual(expected)
    })

    test('should unwrap refs arguments', () => {
      const key = ref(['key'])
      const filters = ref({ fetching: ref(true) })

      const result = parseFilterArgs(key, filters)
      const expected = { mutationKey: ['key'], fetching: true }

      expect(result).toEqual(expected)
    })
  })
})
