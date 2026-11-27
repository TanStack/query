import { describe, expect, it } from 'vitest'
import {
  InfiniteQueryObserver,
  QueryObserver,
  infiniteQueryOptions,
  queryOptions,
  skipToken,
  suspenseInfiniteQueryOptions,
  suspenseQueryOptions,
} from '..'

describe('query descriptors', () => {
  it('selects the regular observer and scopes suspense to an individual reader', () => {
    const input = Object.freeze({ queryKey: ['post'], queryFn: () => 'Dune' })
    const regular = queryOptions(input)
    const [key] = Object.getOwnPropertySymbols(regular)
    expect(Reflect.get(regular, key!)).toBe(QueryObserver)
    expect(Reflect.get({ ...regular }, key!)).toBe(QueryObserver)
    expect(regular.queryFn).toBe(input.queryFn)
    expect(suspenseQueryOptions(input).renderPolicy).toBeDefined()
    expect(
      suspenseQueryOptions({ ...input, queryFn: skipToken }).renderPolicy,
    ).toBeUndefined()
    expect(regular).not.toHaveProperty('renderPolicy')
    expect(Object.getOwnPropertySymbols(input)).toHaveLength(0)
  })

  it('selects the infinite observer without changing the supplied options', () => {
    const input = Object.freeze({
      queryKey: ['pages'],
      initialPageParam: 0,
      queryFn: ({ pageParam }: { pageParam: number }) => pageParam,
      getNextPageParam: () => 1,
    })
    const options = infiniteQueryOptions(input)
    const [key] = Object.getOwnPropertySymbols(options)
    expect(Reflect.get(options, key!)).toBe(InfiniteQueryObserver)
    expect(Reflect.get(suspenseInfiniteQueryOptions(input), key!)).toBe(
      InfiniteQueryObserver,
    )
    expect(Object.getOwnPropertySymbols(input)).toHaveLength(0)
  })
})
