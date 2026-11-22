import { skipToken } from '@tanstack/query-core'
import { createKey } from '@tanstack/query-test-utils'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { useSuspenseQuery } from '../useSuspenseQuery'

describe('useSuspenseQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should allow undefined data when queryFn can be skipToken', () => {
    const skipped = useSuspenseQuery<number>({
      queryKey: createKey(),
      queryFn: skipToken,
    })
    expectTypeOf(skipped.data).toEqualTypeOf<number | undefined>()

    const result = useSuspenseQuery({
      queryKey: createKey(),
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    expectTypeOf(result.data).toEqualTypeOf<string | undefined>()
    if (result.isSuccess) {
      expectTypeOf(result.data).toEqualTypeOf<string>()
    }
    if (result.isPending) {
      expectTypeOf(result.data).toEqualTypeOf<undefined>()
    }
    expectTypeOf(result).not.toHaveProperty('isPlaceholderData')
  })

  it('should not allow placeholderData, enabled or throwOnError props', () => {
    assertType(
      useSuspenseQuery({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        placeholderData: 5,
        enabled: true,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        throwOnError: true,
      }),
    )
  })

  it('should not return isPlaceholderData', () => {
    expectTypeOf(
      useSuspenseQuery({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
      }),
    ).not.toHaveProperty('isPlaceholderData')
  })

  it('should type-narrow the error field', () => {
    const query = useSuspenseQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
    })

    if (query.status === 'error') {
      expectTypeOf(query.error).toEqualTypeOf<Error>()
    }
  })
})
