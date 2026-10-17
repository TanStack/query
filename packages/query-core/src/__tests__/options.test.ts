import { describe, expect, it } from 'vitest'
import { QueryClient } from '../queryClient'
import { MutationObserver } from '../mutationObserver'
import { queryOptions } from '../queryOptions'
import { mutationOptions } from '../mutationOptions'
import { infiniteQueryOptions } from '../infiniteQueryOptions'

describe('core options helpers', () => {
  it('returns infinite options unchanged and fetches pages with the query client', async () => {
    const options = {
      queryKey: ['core-infinite-options'],
      initialPageParam: 0,
      queryFn: ({ pageParam }: { pageParam: number }) =>
        Promise.resolve(pageParam),
      getNextPageParam: (lastPage: number) => lastPage + 1,
    }
    expect(infiniteQueryOptions(options)).toBe(options)
    const client = new QueryClient()
    expect(
      await client.infiniteQuery({
        ...infiniteQueryOptions(options),
        pages: 2,
      }),
    ).toEqual({
      pages: [0, 1],
      pageParams: [0, 1],
    })
    client.clear()
  })
  it('returns query options unchanged and works with the query client', async () => {
    const options = {
      queryKey: ['core-options'],
      queryFn: () => Promise.resolve(42),
    }
    expect(queryOptions(options)).toBe(options)
    const client = new QueryClient()
    expect(await client.query(queryOptions(options))).toBe(42)
    expect(client.getQueryData(options.queryKey)).toBe(42)
    client.clear()
  })

  it('returns mutation options unchanged and works with a mutation observer', async () => {
    const options = {
      mutationFn: (variables: { id: string }) => Promise.resolve(variables.id),
    }
    expect(mutationOptions(options)).toBe(options)
    const client = new QueryClient()
    const observer = new MutationObserver(client, mutationOptions(options))
    expect(await observer.mutate({ id: '1' })).toBe('1')
    client.clear()
  })
})
