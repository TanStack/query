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

  test('setQueryData creates a new query if query was not found, using exact', () => {
    queryCache.setQueryData('foo', 'bar', { exact: true })

    expect(queryCache.getQueryData('foo')).toBe('bar')
  })

  test('setQueryData creates a new query if query was not found', () => {
    queryCache.setQueryData('baz', 'qux')

    expect(queryCache.getQueryData('baz')).toBe('qux')
  })
})
