import { describe, expect, it } from 'vitest'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { QueryClient } from '../queryClient'

describe('infiniteQueryOptions', () => {
  it('should return the options unchanged and fetch pages with the query client', async () => {
    const options = {
      queryKey: ['core-infinite-options'],
      initialPageParam: 0,
      queryFn: ({ pageParam }: { pageParam: number }) =>
        Promise.resolve(pageParam),
      getNextPageParam: (lastPage: number) => lastPage + 1,
    }
    expect(infiniteQueryOptions(options)).toBe(options)
    const client = new QueryClient()
    await expect(
      client.infiniteQuery({ ...infiniteQueryOptions(options), pages: 2 }),
    ).resolves.toStrictEqual({ pages: [0, 1], pageParams: [0, 1] })
    client.clear()
  })
})
