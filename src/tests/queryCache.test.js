import { queryCache } from '../index'
import { act } from '@testing-library/react'
import { sleep } from './utils'

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

  test('prefetchQuery should force fetch', async () => {
    const fetchFn = () => Promise.resolve('fresh')
    const first = await queryCache.prefetchQuery('key', fetchFn, {
      initialData: 'initial',
      force: true,
    })

    expect(first).toBe('fresh')
  })

  test('prefetchQuery should throw error when throwOnError is true', async () => {
    const fetchFn = () =>
      new Promise(() => {
        throw new Error('error')
      })

    await expect(
      queryCache.prefetchQuery('key', undefined, fetchFn, {
        retry: false,
        throwOnError: true,
      })
    ).rejects.toThrow(new Error('error'))
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

  test('removeQueries does not crash when exact is provided', async () => {
    const fetchFn = () => Promise.resolve('data')

    // check the query was added to the cache
    await queryCache.prefetchQuery('key', fetchFn)
    expect(queryCache.getQuery('key')).toBeTruthy()

    // check the error doesn't occur
    expect(() => queryCache.removeQueries('key', { exact: true })).not.toThrow()

    // check query was successful removed
    expect(queryCache.getQuery('key')).toBeFalsy()
  })

  test('setQueryData schedules stale timeouts appropriately', async () => {
    queryCache.setQueryData('key', 'test data', { staleTime: 100 })

    expect(queryCache.getQuery('key').state.data).toEqual('test data')
    expect(queryCache.getQuery('key').state.isStale).toEqual(false)

    await sleep(50)

    expect(queryCache.getQuery('key').state.isStale).toEqual(false)

    await sleep(100)

    expect(queryCache.getQuery('key').state.isStale).toEqual(true)
  })

  test('setQueryData updater function works as expected', () => {
    const updater = jest.fn(oldData => `new data + ${oldData}`)

    queryCache.setQueryData('updater', 'test data')
    queryCache.setQueryData('updater', updater)

    expect(updater).toHaveBeenCalled()
    expect(queryCache.getQuery('updater').state.data).toEqual(
      'new data + test data'
    )
  })

  test('getQueries should return queries that partially match queryKey', async () => {
    const fetchData1 = () => Promise.resolve('data1')
    const fetchData2 = () => Promise.resolve('data2')
    const fetchDifferentData = () => Promise.resolve('data3')
    await queryCache.prefetchQuery(['data', { page: 1 }], fetchData1)
    await queryCache.prefetchQuery(['data', { page: 2 }], fetchData2)
    await queryCache.prefetchQuery(['differentData'], fetchDifferentData)
    const queries = queryCache.getQueries('data')
    const data = queries.map(query => query.state.data)
    expect(data).toEqual(['data1', 'data2'])
  })

  test('stale timeout dispatch is not called if query is no longer in the query cache', async () => {
    const queryKey = 'key'
    const fetchData = () => Promise.resolve('data')
    await queryCache.prefetchQuery(queryKey, fetchData)
    const query = queryCache.getQuery(queryKey)
    expect(query.state.isStale).toBe(false)
    queryCache.removeQueries(queryKey)
    await sleep(50)
    expect(query.state.isStale).toBe(false)
  })
})
