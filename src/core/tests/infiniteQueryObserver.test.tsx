import { sleep, queryKey } from '../../react/tests/utils'
import { QueryCache, QueryClient, InfiniteQueryObserver } from '../..'

describe('InfiniteQueryObserver', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })
  queryClient.mount()

  test('InfiniteQueryObserver should be able to fetch an infinite query with selector', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ queryCache: testCache })
    const observer = new InfiniteQueryObserver(testClient, {
      queryKey: key,
      queryFn: () => 1,
      select: data => ({
        pages: data.pages.map(x => `${x}`),
        pageParams: data.pageParams,
      }),
    })
    let observerResult
    const unsubscribe = observer.subscribe(result => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(observerResult).toMatchObject({
      data: { pages: ['1'], pageParams: [undefined] },
    })
  })
})
