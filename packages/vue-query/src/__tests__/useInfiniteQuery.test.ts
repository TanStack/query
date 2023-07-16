import { useInfiniteQuery } from '../useInfiniteQuery'
import { flushPromises, infiniteFetcher } from './test-utils'

jest.mock('../useQueryClient')

describe('useQuery', () => {
  test('should properly execute infinite query', async () => {
    const { data, fetchNextPage, status } = useInfiniteQuery(
      ['infiniteQuery'],
      infiniteFetcher,
    )

    expect(data.value).toStrictEqual(undefined)
    expect(status.value).toStrictEqual('loading')

    await flushPromises()

    expect(data.value).toStrictEqual({
      pageParams: [undefined],
      pages: ['data on page 0'],
    })
    expect(status.value).toStrictEqual('success')

    fetchNextPage({ pageParam: 12 })

    await flushPromises()

    expect(data.value).toStrictEqual({
      pageParams: [undefined, 12],
      pages: ['data on page 0', 'data on page 12'],
    })
    expect(status.value).toStrictEqual('success')
  })
})
