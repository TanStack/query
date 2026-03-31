import { assertType, describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import type { QueryFilters } from '../utils'
import type { DataTag, QueryKey } from '../types'

describe('QueryFilters', () => {
  it('should be typed unknown even if tagged generics are passed', () => {
    type TData = { a: number; b: string }
    type TError = Error & { message: string }

    const filters: QueryFilters<DataTag<QueryKey, TData, TError>> = {
      predicate(query) {
        expectTypeOf(query.setData({ a: 1, b: '1' })).toEqualTypeOf<unknown>()
        return true
      },
      queryKey: ['key'] as DataTag<undefined, TData, TError>,
    }

    const queryClient = new QueryClient()

    const data = queryClient.getQueryData(filters.queryKey!)
    expectTypeOf(data).toEqualTypeOf<TData | undefined>()

    const error = queryClient.getQueryState(filters.queryKey!)?.error
    expectTypeOf(error).toEqualTypeOf<TError | null | undefined>()
  })

  it('should be loose typed if generics are defaults', () => {
    const a: QueryFilters = {
      predicate(query) {
        expectTypeOf(query.setData({ a: 1, b: '1' })).toEqualTypeOf<unknown>()
        return true
      },
      queryKey: ['key'],
    }

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(a.queryKey!)
    expectTypeOf(data).toEqualTypeOf<unknown>()

    const error = queryClient.getQueryState(a.queryKey!)?.error
    expectTypeOf(error).toEqualTypeOf<Error | null | undefined>()
  })

  it('should allow a partial query key to be passed', () => {
    const filters: QueryFilters<readonly ['key', { a: number; b: string }]> = {
      queryKey: ['key'],
    }

    expectTypeOf(filters.queryKey).toEqualTypeOf<
      | undefined
      | readonly []
      | readonly ['key']
      | readonly [
          'key',
          {
            a: number
            b: string
          },
        ]
    >()
  })

  it('should work with readonly union types', () => {
    const filters: QueryFilters<
      readonly ['key'] | readonly ['key', 'something']
    > = {
      queryKey: ['key'],
    }

    expectTypeOf(filters.queryKey).toEqualTypeOf<
      undefined | readonly [] | readonly ['key'] | readonly ['key', 'something']
    >()
  })

  // we test that there are not type errors here
  // eslint-disable-next-line vitest/expect-expect
  it('should work with unions of different lengths', () => {
    type Key =
      | readonly ['foo']
      | readonly ['foo', 'bar']
      | readonly ['foo', 'bar', 'baz']

    const queryKey: Key = ['foo', 'bar'] as any as Key

    new QueryClient().invalidateQueries({ queryKey })
  })

  it('should error on invalid query keys', () => {
    assertType<QueryFilters<readonly ['key', { a: number; b: string }]>>({
      // @ts-expect-error cannot pass invalid query key
      queryKey: ['invalid', { a: 1, b: '1' }],
    })
  })
})
