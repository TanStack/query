import { skipToken } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { assertType, describe, expectTypeOf, it } from 'vitest'

import type { UseSuspenseQueryResult } from '../types'
import { useSuspenseQuery } from '../useSuspenseQuery'

describe('useSuspenseQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should not allow skipToken in queryFn', () => {
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        // @ts-expect-error
        queryFn: skipToken,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        // @ts-expect-error
        queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      }),
    )
  })

  it('should not allow placeholderData, enabled or throwOnError props', () => {
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        placeholderData: 5,
        enabled: true,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        throwOnError: true,
      }),
    )
  })

  it('should not return isPlaceholderData', () => {
    expectTypeOf(
      useSuspenseQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
      }),
    ).not.toHaveProperty('isPlaceholderData')
  })

  it('should type-narrow the error field', () => {
    const query = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    if (query.status === 'error') {
      expectTypeOf(query.error).toEqualTypeOf<Error>()
    }
  })
})

describe('NoInfer', () => {
  // eslint-disable-next-line vitest/expect-expect
  it('TData should depend only on the arguments, not the annotated result', () => {
    // @ts-expect-error
    const result: UseSuspenseQueryResult<{ wow: string }> = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: () => ({ wow: true }),
    })

    void result
  })

  it('should preserve discriminated-union narrowing on data', () => {
    type Result =
      | { type: 'first'; first: string }
      | { type: 'second'; second: string }

    const { data } = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: (): Result => ({ type: 'first', first: 'a' }),
    })

    const second = data.type === 'first' ? undefined : data

    expectTypeOf(second).toEqualTypeOf<
      { type: 'second'; second: string } | undefined
    >()
  })
})
