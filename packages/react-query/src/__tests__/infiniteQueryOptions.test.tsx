import { infiniteQueryOptions } from '../infiniteQueryOptions'

describe('infiniteQueryOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object = {
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      getNextPageParam: () => null,
    } as const

    expect(infiniteQueryOptions(object)).toStrictEqual(object)
  })
})
