import { queryCache } from '../index'

describe('queryCache', () => {
  test('setQueryData does not crash if query could not be found', () => {
    expect(() =>
      queryCache.setQueryData(['USER', { userId: 1 }], prevUser => ({
        ...prevUser,
        name: 'Edvin',
      }))
    ).not.toThrow()
  })

  test('setQueryData does not crash if query could not be found', async () => {
    const fetchFn = () => Promise.resolve('data')
    const first = await queryCache.prefetchQuery('key', fetchFn)
    const second = await queryCache.prefetchQuery('key', fetchFn)

    expect(second).toBe(first)
  })
})
