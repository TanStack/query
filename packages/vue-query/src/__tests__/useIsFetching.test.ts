import { onScopeDispose, reactive, ref } from 'vue-demi'

import { flushPromises, simpleFetcher } from './test-utils'
import { useQuery } from '../useQuery'
import { parseFilterArgs, useIsFetching } from '../useIsFetching'

jest.mock('../useQueryClient')

describe('useIsFetching', () => {
  test('should properly return isFetching state', async () => {
    const { isFetching: isFetchingQuery } = useQuery({
      queryKey: ['isFetching1'],
      queryFn: simpleFetcher,
    })
    useQuery({ queryKey: ['isFetching2'], queryFn: simpleFetcher })
    const isFetching = useIsFetching()

    expect(isFetchingQuery.value).toStrictEqual(true)
    expect(isFetching.value).toStrictEqual(2)

    await flushPromises()

    expect(isFetchingQuery.value).toStrictEqual(false)
    expect(isFetching.value).toStrictEqual(0)
  })

  test('should stop listening to changes on onScopeDispose', async () => {
    const onScopeDisposeMock = onScopeDispose as jest.MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementation((fn) => fn())

    const { status } = useQuery({
      queryKey: ['onScopeDispose'],
      queryFn: simpleFetcher,
    })
    const isFetching = useIsFetching()

    expect(status.value).toStrictEqual('loading')
    expect(isFetching.value).toStrictEqual(1)

    await flushPromises()

    expect(status.value).toStrictEqual('loading')
    expect(isFetching.value).toStrictEqual(1)

    await flushPromises()

    expect(status.value).toStrictEqual('loading')
    expect(isFetching.value).toStrictEqual(1)

    onScopeDisposeMock.mockReset()
  })

  test('should properly update filters', async () => {
    const filter = reactive({ stale: false })
    useQuery({
      queryKey: ['isFetching'],
      queryFn: () =>
        new Promise((resolve) => {
          setTimeout(() => {
            return resolve('Some data')
          }, 100)
        }),
    })
    const isFetching = useIsFetching(filter)

    expect(isFetching.value).toStrictEqual(0)

    filter.stale = true
    await flushPromises()

    expect(isFetching.value).toStrictEqual(1)

    await flushPromises(100)
  })

  describe('parseFilterArgs', () => {
    test('should default to empty filters', () => {
      const result = parseFilterArgs(undefined)

      expect(result).toEqual({})
    })

    test('should merge query key with filters', () => {
      const filters = { queryKey: ['key'], stale: true }

      const result = parseFilterArgs(filters)
      const expected = { ...filters, queryKey: ['key'] }

      expect(result).toEqual(expected)
    })

    test('should unwrap refs arguments', () => {
      const key = ref(['key'])
      const filters = ref({ queryKey: key, stale: ref(true) })

      const result = parseFilterArgs(filters)
      const expected = { queryKey: ['key'], stale: true }

      expect(result).toEqual(expected)
    })
  })
})
