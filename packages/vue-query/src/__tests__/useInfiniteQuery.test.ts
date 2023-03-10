import { infiniteFetcher, flushPromises } from './test-utils'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { vi } from 'vitest'

vi.mock('../useQueryClient')

describe('useQuery', () => {
  test('should properly execute infinite query', async () => {
    const { data, fetchNextPage, status } = useInfiniteQuery({
      queryKey: ['infiniteQuery'],
      queryFn: infiniteFetcher,
      defaultPageParam: 0,
      getNextPageParam: () => 12,
    })

    expect(data.value).toStrictEqual(undefined)
    expect(status.value).toStrictEqual('pending')

    await flushPromises()

    expect(data.value).toStrictEqual({
      pageParams: [0],
      pages: ['data on page 0'],
    })
    expect(status.value).toStrictEqual('success')

    fetchNextPage()

    await flushPromises()

    expect(data.value).toStrictEqual({
      pageParams: [0, 12],
      pages: ['data on page 0', 'data on page 12'],
    })
    expect(status.value).toStrictEqual('success')
  })
})
