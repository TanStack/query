import { describe, expect, test, vi } from 'vitest'
import { onScopeDispose, reactive } from 'vue-demi'
import { useQuery } from '../useQuery'
import { useIsFetching } from '../useIsFetching'
import { flushPromises, simpleFetcher } from './test-utils'
import type { MockedFunction } from 'vitest'

vi.mock('../useQueryClient')

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
    const onScopeDisposeMock = onScopeDispose as MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementation((fn) => fn())

    const { status } = useQuery({
      queryKey: ['onScopeDispose'],
      queryFn: simpleFetcher,
    })
    const isFetching = useIsFetching()

    expect(status.value).toStrictEqual('pending')
    expect(isFetching.value).toStrictEqual(1)

    await flushPromises()

    expect(status.value).toStrictEqual('pending')
    expect(isFetching.value).toStrictEqual(1)

    await flushPromises()

    expect(status.value).toStrictEqual('pending')
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
  })
})
