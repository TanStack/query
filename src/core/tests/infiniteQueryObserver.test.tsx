import { sleep, queryKey } from '../../react/tests/utils'
import { QueryCache, Environment, watchInfiniteQuery } from '../..'

describe('InfiniteQueryObserver', () => {
  const queryCache = new QueryCache()
  const environment = new Environment({ queryCache })
  environment.mount()

  test('InfiniteQueryObserver should be able to fetch an infinite query with selector', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new Environment({ queryCache: testCache })
    const observer = watchInfiniteQuery(testClient, {
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
