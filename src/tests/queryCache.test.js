import { queryCache } from '../index'

describe('queryCache', () => {
  afterEach(() => {
    queryCache.clear()
  })

  test('setQueryData does not crash if query could not be found', () => {
    expect(() =>
      queryCache.setQueryData(['USER', { userId: 1 }], prevUser => ({
        ...prevUser,
        name: 'Edvin',
      }))
    ).not.toThrow()
  })

  test('prefetchQuery returns the cached data on cache hits', async () => {
    const fetchFn = () => Promise.resolve('data')
    const first = await queryCache.prefetchQuery('key', fetchFn)
    const second = await queryCache.prefetchQuery('key', fetchFn)

    expect(second).toBe(first)
  })

  test('should notify listeners when new query is added', () => {
    const callback = jest.fn()

    queryCache.subscribe(callback)

    queryCache.prefetchQuery('test', () => 'data')

    expect(callback).toHaveBeenCalled()
  })

  test('should notify subsribers when new query with initialData is added', () => {
    const callback = jest.fn()

    queryCache.subscribe(callback)

    queryCache.prefetchQuery('test', () => {}, { initialData: 'initial' })

    expect(callback).toHaveBeenCalled()
  })

  test('removeQueries does not crash when exact is provided', async () => {
    const callback = jest.fn()
    const fetchFn = () => Promise.resolve('data')

    // check the query was added to the cache
    await queryCache.prefetchQuery('key', fetchFn)
    expect(queryCache.getQuery('key')).toBeTruthy()

    // check the error doesn't occur
    expect(() => queryCache.removeQueries('key', { exact: true })).not.toThrow()

    // check query was successful removed
    expect(queryCache.getQuery('key')).toBeFalsy()
  })
})
